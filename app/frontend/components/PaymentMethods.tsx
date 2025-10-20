import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

type PaymentMethodRecord = {
  id: string;
  brand: string | null;
  last_four: string | null;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  stripe_payment_method_id: string | null;
  created_at: string;
};

type UserProfileSummary = {
  subscription_tier: string | null;
  total_spent: number | null;
  monthly_budget: number | null;
};

interface PaymentMethodsProps {
  onDefaultChange?: (paymentMethodId: string) => void;
  onRemove?: (paymentMethodId: string) => void;
  className?: string;
}

const formatCurrency = (value: number | null | undefined) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "$0.00";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
};

const maskCardNumber = (
  lastFour: string | number | null | undefined
): string => {
  const digits =
    typeof lastFour === "number" ? lastFour.toString() : lastFour ?? "";
  const normalized = digits.replace(/\D/g, "").slice(-4);
  return `•••• ${normalized.padStart(4, "•")}`;
};

export const PaymentMethods: React.FC<PaymentMethodsProps> = ({
  onDefaultChange,
  onRemove,
  className = "",
}) => {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodRecord[]>(
    []
  );
  const [userProfile, setUserProfile] = useState<UserProfileSummary | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);

  const loadUserData = useCallback(
    async (options?: { signal?: AbortSignal }) => {
      if (!userId) {
        if (!options?.signal?.aborted) {
          setPaymentMethods([]);
          setUserProfile(null);
          setLoading(false);
        }
        return;
      }

      if (options?.signal?.aborted) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [
          { data: methodsData, error: methodsError },
          { data: profileData, error: profileError },
        ] = await Promise.all([
          supabase
            .from("payment_methods")
            .select(
              "id, brand, last_four, exp_month, exp_year, is_default, stripe_payment_method_id, created_at"
            )
            .eq("user_id", userId)
            .order("is_default", { ascending: false })
            .order("created_at", { ascending: false }),
          supabase
            .from("user_profiles")
            .select("subscription_tier,total_spent,monthly_budget")
            .eq("user_id", userId)
            .maybeSingle(),
        ]);

        if (options?.signal?.aborted) {
          return;
        }

        if (methodsError) {
          throw methodsError;
        }
        if (profileError) {
          throw profileError;
        }

        setPaymentMethods((methodsData ?? []) as PaymentMethodRecord[]);
        setUserProfile(
          profileData ? (profileData as UserProfileSummary) : null
        );
      } catch (loadError) {
        if (options?.signal?.aborted) {
          return;
        }

        const message =
          loadError instanceof Error
            ? loadError.message
            : "Failed to load payment information";
        console.error("Payment methods load error:", loadError);
        setError(message);
      } finally {
        if (!options?.signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [userId]
  );

  useEffect(() => {
    if (authLoading) {
      return;
    }

    const controller = new AbortController();
    loadUserData({ signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [authLoading, loadUserData]);

  const handleSetDefaultPayment = useCallback(
    async (paymentMethodId: string) => {
      if (!userId) {
        return;
      }

      setError(null);

      try {
        const unsetResult = await supabase
          .from("payment_methods")
          .update({ is_default: false })
          .eq("user_id", userId);

        if (unsetResult.error) {
          throw unsetResult.error;
        }

        const { error: setResultError } = await supabase
          .from("payment_methods")
          .update({ is_default: true })
          .eq("id", paymentMethodId);

        if (setResultError) {
          throw setResultError;
        }

        await loadUserData();
        onDefaultChange?.(paymentMethodId);
      } catch (setDefaultError) {
        const message =
          setDefaultError instanceof Error
            ? setDefaultError.message
            : "Failed to set default payment method";
        setError(message);
      }
    },
    [loadUserData, onDefaultChange, userId]
  );

  const handleDeletePayment = useCallback(
    async (paymentMethodId: string, stripePaymentMethodId?: string | null) => {
      if (!userId) {
        return;
      }

      setError(null);

      try {
        // TODO: Integrate with Stripe to detach the payment method using stripePaymentMethodId.
        const { error: deleteError } = await supabase
          .from("payment_methods")
          .delete()
          .eq("id", paymentMethodId)
          .eq("user_id", userId);

        if (deleteError) {
          throw deleteError;
        }

        await loadUserData();
        onRemove?.(paymentMethodId);
      } catch (deleteMethodError) {
        const message =
          deleteMethodError instanceof Error
            ? deleteMethodError.message
            : "Failed to remove payment method";
        setError(message);
      }
    },
    [loadUserData, onRemove, userId]
  );

  const profileSummary = useMemo(() => {
    if (!userProfile) {
      return null;
    }

    return {
      tier: userProfile.subscription_tier ?? "free",
      totalSpent: formatCurrency(userProfile.total_spent),
      monthlyBudget: formatCurrency(userProfile.monthly_budget),
    };
  }, [userProfile]);

  const AddCardForm: React.FC = () => {
    const [cardData, setCardData] = useState({
      number: "",
      expMonth: "",
      expYear: "",
      cvc: "",
      name: "",
    });

    const handleAddCard = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(
        "Stripe integration is required. Please contact support to add payment methods."
      );
    };

    return (
      <form
        className="space-y-4 rounded-md border border-gray-300 p-4"
        onSubmit={handleAddCard}
      >
        <h4 className="font-medium text-gray-900 dark:text-gray-100">
          Add New Card
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Card Number
            </label>
            <input
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              maxLength={19}
              placeholder="1234 5678 9012 3456"
              type="text"
              value={cardData.number}
              onChange={(event) =>
                setCardData({ ...cardData, number: event.target.value })
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              MM
            </label>
            <input
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              maxLength={2}
              placeholder="MM"
              type="text"
              value={cardData.expMonth}
              onChange={(event) =>
                setCardData({ ...cardData, expMonth: event.target.value })
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              YY
            </label>
            <input
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              maxLength={2}
              placeholder="YY"
              type="text"
              value={cardData.expYear}
              onChange={(event) =>
                setCardData({ ...cardData, expYear: event.target.value })
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              CVC
            </label>
            <input
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              maxLength={4}
              placeholder="123"
              type="text"
              value={cardData.cvc}
              onChange={(event) =>
                setCardData({ ...cardData, cvc: event.target.value })
              }
            />
          </div>

          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Cardholder Name
            </label>
            <input
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Jordan Example"
              type="text"
              value={cardData.name}
              onChange={(event) =>
                setCardData({ ...cardData, name: event.target.value })
              }
            />
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            type="submit"
          >
            Add Card
          </button>
          <button
            className="rounded-md bg-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-400"
            type="button"
            onClick={() => setShowAddCard(false)}
          >
            Cancel
          </button>
        </div>

        <div className="text-xs text-gray-500">
          <p>🔒 Card handling is processed securely via Stripe.</p>
          <p>
            Contact support to enable billing and connect your verified Stripe
            account.
          </p>
        </div>
      </form>
    );
  };

  if (authLoading || loading) {
    return (
      <div className={`flex items-center space-x-2 p-4 ${className}`}>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        <span className="text-sm text-gray-600">Loading payment methods…</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className={`rounded-md border border-gray-300 bg-gray-50 p-4 ${className}`}
      >
        <p className="text-sm text-gray-600">
          Please sign in to manage payment methods.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {profileSummary && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <h3 className="mb-2 font-medium text-blue-900 dark:text-blue-100">
            Account Overview
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700 dark:text-blue-300">
                Subscription:
              </span>
              <span className="ml-2 font-medium capitalize">
                {profileSummary.tier}
              </span>
            </div>
            <div>
              <span className="text-blue-700 dark:text-blue-300">
                Total Spent:
              </span>
              <span className="ml-2 font-medium">
                {profileSummary.totalSpent}
              </span>
            </div>
            <div>
              <span className="text-blue-700 dark:text-blue-300">
                Monthly Budget:
              </span>
              <span className="ml-2 font-medium">
                {profileSummary.monthlyBudget}
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

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            Payment Methods
          </h3>
          <button
            className="rounded-md bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
            onClick={() => setShowAddCard(true)}
          >
            Add Card
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-md border border-red-300 bg-red-100 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {showAddCard && <AddCardForm />}

        {paymentMethods.length === 0 ? (
          <div className="rounded-md border border-gray-300 p-4 text-center">
            <p className="text-sm text-gray-500">
              No payment methods added yet.
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Add a card to unlock paid enrichment tiers and exports.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`rounded-md border p-3 ${
                  method.is_default
                    ? "border-green-300 bg-green-50 dark:bg-green-900/20"
                    : "border-gray-300 bg-white dark:bg-gray-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="font-medium capitalize">
                        {method.brand ?? "Card"}
                      </span>
                      <span className="text-gray-500">
                        {maskCardNumber(method.last_four)}
                      </span>
                      {method.is_default && (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      Expires {String(method.exp_month).padStart(2, "0")}/
                      {method.exp_year}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!method.is_default && (
                      <button
                        className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 hover:bg-blue-200"
                        onClick={() => handleSetDefaultPayment(method.id)}
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200"
                      onClick={() =>
                        handleDeletePayment(
                          method.id,
                          method.stripe_payment_method_id
                        )
                      }
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
