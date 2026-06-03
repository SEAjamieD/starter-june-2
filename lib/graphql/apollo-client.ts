import { ApolloLink, HttpLink } from "@apollo/client";
import {
  ApolloClient,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";

const graphqlUri =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:4000/graphql";

export function makeApolloClient() {
  const httpLink = new HttpLink({
    uri: graphqlUri,
  });

  // const authLink = new ApolloLink((operation, forward) => {
  //   // Attach auth headers here when GraphQL auth is wired.
  //   return forward(operation);
  // });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([
      // authLink,
      httpLink,
    ]),
  });
}
