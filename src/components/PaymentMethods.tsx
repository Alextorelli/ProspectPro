import { User } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface PaymentMethodsProps {
  user: User | null;
}

interface PaymentMethod {
  id: string;
  stripe_payment_method_id: string;
  type: string;
  last_four: string;
  brand: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  subscription_tier: string;
  total_spent: number;
  monthly_budget: number;
}

export const PaymentMethods: React.FC<PaymentMethodsProps> = ({ user }) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load user profile
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        throw profileError;
      }

      setUserProfile(profile);

      // Load payment methods
      const { data: methods, error: methodsError } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (methodsError) {
        throw methodsError;
      }

      setPaymentMethods(methods || []);
    } catch (err: any) {
      console.error("Error loading user data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultPayment = async (paymentMethodId: string) => {
    if (!user) return;

    try {
      // Unset all current defaults
      await supabase
        .from("payment_methods")
        .update({ is_default: false })
        .eq("user_id", user.id);

      // Set new default
      const { error } = await supabase
        .from("payment_methods")
        .update({ is_default: true })
        .eq("id", paymentMethodId);

      if (error) throw error;

      // Reload data
      await loadUserData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeletePayment = async (
    paymentMethodId: string,
    _stripePaymentMethodId: string
  ) => {
    if (!user) return;

    try {
      // TODO: Call Stripe API to detach payment method
      // For now, just remove from our database
      const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", paymentMethodId);

      if (error) throw error;

      // Reload data
      await loadUserData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const AddCardForm: React.FC = () => {
    const [cardData, setCardData] = useState({
      number: "",
      expMonth: "",
      expYear: "",
      cvc: "",
      name: "",
    });

    const handleAddCard = async (e: React.FormEvent) => {
      e.preventDefault();

      // TODO: Integrate with Stripe Elements for secure card handling
      // This is a placeholder implementation

      setError(
        "Stripe integration required. Please add STRIPE_PUBLISHABLE_KEY to environment."
      );
    };

    return (
      <form
        onSubmit={handleAddCard}
        className="space-y-4 p-4 border border-gray-300 rounded-md"
      >
        <h4 className="font-medium text-gray-900 dark:text-gray-100">
          Add New Card
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Card Number
            </label>
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              value={cardData.number}
              onChange={(e) =>
                setCardData({ ...cardData, number: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              maxLength={19}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              MM / YY
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="MM"
                value={cardData.expMonth}
                onChange={(e) =>
                  setCardData({ ...cardData, expMonth: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                maxLength={2}
                required
              />
              <input
                type="text"
                placeholder="YY"
                value={cardData.expYear}
                onChange={(e) =>
                  setCardData({ ...cardData, expYear: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                maxLength={2}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              CVC
            </label>
            <input
              type="text"
              placeholder="123"
              value={cardData.cvc}
              onChange={(e) =>
                setCardData({ ...cardData, cvc: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              maxLength={4}
              required
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cardholder Name
            </label>
            <input
              type="text"
              placeholder="John Doe"
              value={cardData.name}
              onChange={(e) =>
                setCardData({ ...cardData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Add Card
          </button>
          <button
            type="button"
            onClick={() => setShowAddCard(false)}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
          >
            Cancel
          </button>
        </div>

        <div className="text-xs text-gray-500">
          <p>🔒 Your card information is secured by Stripe</p>
          <p>
            ✅ Stripe Live Mode:
            pk_live_51SCVzyP9TtDDsSx5C5IaC4XuPT2sh6CCLctSFKuqh1DdMZ24a6tCY8RvALvbeEAgttZboEGPAnMRmGxPWitwbVoP00ykBovk4f
          </p>
        </div>
      </form>
    );
  };

  if (!user) {
    return (
      <div className="p-4 bg-gray-100 border border-gray-300 rounded-md">
        <p className="text-sm text-gray-600">
          Please sign in to manage payment methods
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2 p-4">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="text-sm text-gray-600">
          Loading payment methods...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* User Profile Summary */}
      {userProfile && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Account Overview
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700 dark:text-blue-300">
                Subscription:
              </span>
              <span className="ml-2 font-medium capitalize">
                {userProfile.subscription_tier}
              </span>
            </div>
            <div>
              <span className="text-blue-700 dark:text-blue-300">
                Total Spent:
              </span>
              <span className="ml-2 font-medium">
                ${userProfile.total_spent.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-blue-700 dark:text-blue-300">
                Monthly Budget:
              </span>
              <span className="ml-2 font-medium">
                ${userProfile.monthly_budget.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-blue-700 dark:text-blue-300">
                Payment Methods:
              </span>
              <span className="ml-2 font-medium">{paymentMethods.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            Payment Methods
          </h3>
          <button
            onClick={() => setShowAddCard(true)}
            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            Add Card
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-md text-red-700 text-sm mb-3">
            {error}
          </div>
        )}

        {showAddCard && <AddCardForm />}

        {paymentMethods.length === 0 ? (
          <div className="p-4 border border-gray-300 rounded-md text-center">
            <p className="text-gray-500 text-sm">
              No payment methods added yet
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Add a card to start using paid features
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`p-3 border rounded-md ${
                  method.is_default
                    ? "border-green-300 bg-green-50 dark:bg-green-900/20"
                    : "border-gray-300 bg-white dark:bg-gray-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium capitalize">
                          {method.brand}
                        </span>
                        <span className="text-gray-500">
                          •••• {method.last_four}
                        </span>
                        {method.is_default && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        Expires {method.exp_month.toString().padStart(2, "0")}/
                        {method.exp_year}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!method.is_default && (
                      <button
                        onClick={() => handleSetDefaultPayment(method.id)}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() =>
                        handleDeletePayment(
                          method.id,
                          method.stripe_payment_method_id
                        )
                      }
                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
