import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useBusiness } from "@/contexts/BusinessContext";
import { Button } from "@/components/ui/button";
import { CreditCard, Lock } from "lucide-react";

interface SubscriptionGateProps {
  children?: ReactNode;
  feature?: string;
}

const SubscriptionGate = ({ children, feature = "this feature" }: SubscriptionGateProps) => {
  const { isSubscribed, business } = useBusiness();
  const navigate = useNavigate();

  if (isSubscribed) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Lock size={28} className="text-primary" />
      </div>
      <h2 className="font-heading text-2xl font-bold mb-2">Subscription Required</h2>
      <p className="text-muted-foreground font-body text-sm max-w-md mb-6">
        You need an active subscription to access {feature}. 
        {business?.subscription_status === "trial" 
          ? " Your trial is active — subscribe to continue after it ends."
          : " Choose a plan to get started."}
      </p>
      <Button variant="hero" onClick={() => navigate("/dashboard/subscribe")} className="gap-2">
        <CreditCard size={16} /> View Plans & Subscribe
      </Button>
    </div>
  );
};

export default SubscriptionGate;
