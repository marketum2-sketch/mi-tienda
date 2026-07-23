"use client";

import { useEffect, useRef } from "react";

type Props = {
  onCreateOrder: () => Promise<string>;
  onSuccess: (orderId: string) => void;
  onError: (message: string) => void;
};

declare global {
  interface Window {
    paypal?: any;
  }
}

export default function PaypalButton({ onCreateOrder, onSuccess, onError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);

  useEffect(() => {
    function renderButtons() {
      if (rendered.current || !window.paypal || !containerRef.current) return;
      rendered.current = true;

      window.paypal
        .Buttons({
          style: { layout: "vertical", color: "black", shape: "rect", label: "paypal" },
          createOrder: async () => {
            try {
              return await onCreateOrder();
            } catch (e: any) {
              onError(e.message || "Error al crear el pedido");
              throw e;
            }
          },
          onApprove: async (data: any) => {
            try {
              const res = await fetch("/api/paypal/capture-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paypalOrderId: data.orderID }),
              });
              const json = await res.json();
              if (!res.ok) throw new Error(json.error || "No se pudo confirmar el pago");
              onSuccess(json.orderId);
            } catch (e: any) {
              onError(e.message || "Error al confirmar el pago");
            }
          },
          onError: () => onError("Ocurrio un error con PayPal. Intenta de nuevo."),
        })
        .render(containerRef.current);
    }

    if (window.paypal) {
      renderButtons();
      return;
    }

    const existing = document.getElementById("paypal-sdk");
    if (existing) {
      existing.addEventListener("load", renderButtons);
      return;
    }

    const script = document.createElement("script");
    script.id = "paypal-sdk";
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`;
    script.onload = renderButtons;
    document.body.appendChild(script);
  }, []);

  return <div ref={containerRef} />;
}
