import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "weddingStorage",
  access: (allow) => ({
    "protected/*": [
      allow.authenticated.to(["read", "write", "delete"]),
    ],
  }),
});