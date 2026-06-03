"use client";

import { ApolloNextAppProvider } from "@apollo/client-integration-nextjs";

import { makeApolloClient } from "@/lib/graphql/apollo-client";

type ApolloWrapperProps = {
  children: React.ReactNode;
};

export function ApolloWrapper({ children }: ApolloWrapperProps) {
  return (
    <ApolloNextAppProvider makeClient={makeApolloClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
