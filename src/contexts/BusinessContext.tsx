import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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
  selectBusiness: (id: string) => void;
  refetchBusinesses: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType>({
  business: null, memberRole: null, businesses: [], loading: true,
  selectBusiness: () => {}, refetchBusinesses: async () => {},
});

export const useBusiness = () => useContext(BusinessContext);

export const BusinessProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [memberRole, setMemberRole] = useState<MemberRole | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBusinesses = async () => {
    if (!user) { setBusinesses([]); setBusiness(null); setLoading(false); return; }
    
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
    setLoading(false);
  };

  useEffect(() => { fetchBusinesses(); }, [user]);

  const selectBusiness = (id: string) => {
    const biz = businesses.find((b) => b.id === id);
    if (biz) setBusiness(biz);
  };

  return (
    <BusinessContext.Provider value={{
      business, memberRole, businesses, loading,
      selectBusiness, refetchBusinesses: fetchBusinesses,
    }}>
      {children}
    </BusinessContext.Provider>
  );
};
