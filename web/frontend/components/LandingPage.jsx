import React from "react";
import {
  Link,
  AccountConnection,
  Layout,
  SkeletonPage,
  LegacyCard,
} from "@shopify/polaris";
import { Toast } from "@shopify/app-bridge-react";
import { useTranslation } from "react-i18next";
import { useAppQuery, useAuthenticatedFetch } from "../hooks";
import { useState, useCallback, useEffect } from "react";

export function LandingPage() {
  const fetch = useAuthenticatedFetch();
  const [connected, setConnected] = useState(false);
  const accountName = connected ? "" : "";
  const [shopName, setShopName] = useState(null);
  const emptyToastProps = { content: null };
  const [isLoading, setIsLoading] = useState(true);
  const [toastProps, setToastProps] = useState(emptyToastProps);
  const { t } = useTranslation();

  const toastMarkup = toastProps.content && (
    <Toast {...toastProps} onDismiss={() => setToastProps(emptyToastProps)} />
  );

  const data = fetch("/api/shopdetail", {
    method: "get",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      return response.json(); // Parse response body as JSON
    })
    .then((data) => {
      setShopName(data.shopdata[0].domain);
      const metafieldsData = data.metadata;
      const restockAlertMetafield = metafieldsData.find(
        (metafield) => metafield.namespace === "restock_alert"
      );
      var isStatus = restockAlertMetafield.value === "true";
      setConnected(isStatus);
      setIsLoading(false);
    })
    .catch((error) => {
      console.log(error);
    });

  const contentStatus = connected ? "Deactivate" : "Activate";
  if (contentStatus === "Deactivate") {
    var enabled = "disabled";
  } else {
    var enabled = "enabled";
  }

  const buttonText = connected ? "Deactivate" : "Activate";
  const details = connected
    ? "Restock Alert is activated on your store."
    : "Restock Alert app is deactivated on your store.";

  const handleAction = async () => {
    setIsLoading(true);
    const response = await fetch("/api/updateshopdetail", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        enable_disable_status: !connected,

        shopname: shopName,
      }),
    })
      .then(async (response) => {
        if (response.ok) {
          setConnected(!connected);
          setToastProps({
            content: connected === true ? "Deactivated" : "Activated",
          });
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.log(error);
      });

    return true;
  };

  return (
    <>
      {toastMarkup}
      <Layout>
        <Layout.Section>
          <LegacyCard title="Welcome to Restock Alert App" sectioned>
            <AccountConnection
              action={{
                content: buttonText,
                onAction: handleAction,
                loading: isLoading,
              }}
              details={details}
            />
          </LegacyCard>
        </Layout.Section>
      </Layout>
    </>
  );
}
