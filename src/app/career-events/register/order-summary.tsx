"use client";

import { withForm } from "@/app/_components/form";
import { PaymentDisclaimer } from "@/app/_components/payment-disclaimer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { cn, formatMoney } from "@/lib/utils";
import { useSelector } from "@tanstack/react-form";
import { LockKeyhole } from "lucide-react";
import {
  StatusAlert,
  type CheckoutNotice,
  type RegistrationConfiguration,
} from "./checkout";
import { defaultValues, representativeSurcharge } from "./schema";

export const OrderSummary = withForm({
  defaultValues,
  props: {
    configuration: undefined as unknown as RegistrationConfiguration,
    notice: undefined as CheckoutNotice | undefined,
  },
  render: function Render({ form, configuration, notice }) {
    const priceId = useSelector(form.store, (state) => state.values.priceId);
    const packageId = useSelector(
      form.store,
      (state) => state.values.packageId,
    );
    const representativeCount = useSelector(
      form.store,
      (state) => state.values.representativeCount,
    );
    const selectedPackage = configuration.packages.find(
      (registrationPackage) => registrationPackage.id === packageId,
    );
    const selectedOption = selectedPackage?.options.find(
      (option) => option.priceId === priceId,
    );
    const extraFee = representativeSurcharge(
      representativeCount,
      configuration.additionalRepresentative.unitAmount,
    );
    return (
      <aside className="bg-background sticky bottom-0 z-10 py-4 md:top-24 md:bottom-auto md:max-h-[calc(100vh-6rem)] md:overflow-y-auto md:bg-transparent md:py-0">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent className={selectedOption ? "space-y-3" : undefined}>
            {!selectedOption ? (
              <Item variant="muted">
                <ItemContent>
                  <ItemTitle>Select a package and tier</ItemTitle>
                  <ItemDescription>
                    Your total will appear here.
                  </ItemDescription>
                </ItemContent>
              </Item>
            ) : (
              <>
                <div className="space-y-2">
                  <ReceiptLine
                    label={selectedOption.name}
                    value={formatMoney(
                      selectedOption.unitAmount,
                      selectedOption.currency,
                    )}
                  />
                  {extraFee > 0 ? (
                    <ReceiptLine
                      label={`${representativeCount - 2} additional ${representativeCount === 3 ? "representative" : "representatives"}`}
                      value={formatMoney(
                        extraFee,
                        configuration.additionalRepresentative.currency,
                      )}
                    />
                  ) : null}
                </div>
                <Separator />
                <ReceiptLine
                  emphasized
                  label="Total due today"
                  value={formatMoney(
                    selectedOption.unitAmount + extraFee,
                    selectedOption.currency,
                  )}
                />
                <Separator />

                {notice ? <StatusAlert notice={notice} /> : null}

                <form.AppForm>
                  <form.SubmitButton
                    className="w-full"
                    pending={
                      <>
                        <Spinner />
                        Opening Stripe…
                      </>
                    }
                    size="lg"
                  >
                    <LockKeyhole />
                    Pay and register
                  </form.SubmitButton>
                </form.AppForm>

                <PaymentDisclaimer />
              </>
            )}
          </CardContent>
        </Card>
      </aside>
    );
  },
});

function ReceiptLine({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div
      aria-live={emphasized ? "polite" : undefined}
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4",
        emphasized ? "text-base font-bold" : "text-sm",
      )}
    >
      <div>
        <div>{label}</div>
      </div>
      <span>{value}</span>
    </div>
  );
}
