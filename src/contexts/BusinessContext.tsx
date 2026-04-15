import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { useLocation } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type Business = Database["public"]["Tables"]["businesses"]["Row"];
type MemberRole = Database["public"]["Enums"]["member_role"];

interface BusinessContextType {
  business: Business | null;
  memberRole: MemberRole | null;
  businesses: Business[];
  loading: boolean;
  isSubscribed: boolean;
  selectBusiness: (id: string) => void;
  refetchBusinesses: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType>({
  business: null, memberRole: null, businesses: [], loading: true, isSubscribed: false,
  selectBusiness: () => {}, refetchBusinesses: async () => {},
});

export const useBusiness = () => useContext(BusinessContext);

const ACTIVE_STATUSES = ["active", "trial"];

export const BusinessProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const location = useLocation();
  const [business, setBusiness] = useState<Business | null>(null);
  const [memberRole, setMemberRole] = useState<MemberRole | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBusinesses = useCallback(async () => {
    if (authLoading) return; // Wait for auth to finish
    if (!user) {
      setBusinesses([]);
      setBusiness(null);
      setMemberRole(null);
      setLoading(false);
      return;
    }

    try {
      // Check for admin impersonation
      const impersonateId = sessionStorage.getItem("admin_impersonate_business_id");
      if (isAdmin && impersonateId && !location.pathname.startsWith("/admin")) {
        const { data: impBiz } = await supabase.from("businesses").select("*").eq("id", impersonateId).single();
        if (impBiz) {
          setBusinesses([impBiz]);
          setBusiness(impBiz);
          setMemberRole("owner");
          setLoading(false);
          return;
        }
      }

      // Clear impersonation when navigating to admin
      if (location.pathname.startsWith("/admin")) {
        sessionStorage.removeItem("admin_impersonate_business_id");
      }

      const { data: members } = await supabase
        .from("business_members")
        .select("business_id, role, businesses(*)")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (members && members.length > 0) {
        const bizList = members.map((m) => m.businesses).filter(Boolean) as Business[];
        setBusinesses(bizList);

        if (!business || !bizList.find((b) => b.id === business.id)) {
          setBusiness(bizList[0]);
          setMemberRole(members[0].role);
        } else {
          const current = members.find((m) => m.business_id === business.id);
          setMemberRole(current?.role ?? null);
        }
      } else {
        setBusinesses([]);
        setBusiness(null);
        setMemberRole(null);
      }
    } catch (err) {
      console.error("Failed to fetch businesses:", err);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, authLoading, location.pathname]);

  useEffect(() => {
    setLoading(true);
    fetchBusinesses();
  }, [fetchBusinesses]);

  const isSubscribed = !!business && ACTIVE_STATUSES.includes(business.subscription_status ?? "");

  const selectBusiness = (id: string) => {
    const biz = businesses.find((b) => b.id === id);
    if (biz) setBusiness(biz);
  };

  return (
    <BusinessContext.Provider value={{
      business, memberRole, businesses, loading, isSubscribed,
      selectBusiness, refetchBusinesses: fetchBusinesses,
    }}>
      {children}
    </BusinessContext.Provider>
  );
};
