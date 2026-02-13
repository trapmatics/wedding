import { a, defineData, type ClientSchema } from "@aws-amplify/backend";

const schema = a.schema({
  UserProfile: a
    .model({
      displayName: a.string().required(),
      createdAt: a.datetime().required(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["read"]),
      allow.owner().to(["create", "read", "update", "delete"]),
      allow.group("ADMIN").to(["read"]),
    ]),

  Post: a
    .model({
      content: a.string().required(),
      createdAt: a.datetime().required(),
      authorName: a.string().required(),
      photoKeys: a.string().array(),
      isAnnouncement: a.boolean().default(false),
      isPinned: a.boolean().default(false),
    })
    .authorization((allow) => [
      allow.authenticated().to(["read"]),
      // If you want ONLY admins to delete posts, remove owner delete here.
      allow.owner().to(["create", "update", "delete"]),
      allow.group("ADMIN").to(["create", "update", "delete"]),
    ]),

  Comment: a
    .model({
      postId: a.id().required(),
      content: a.string().required(),
      createdAt: a.datetime().required(),
      authorName: a.string().required(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["read"]),
      allow.owner().to(["create", "update", "delete"]),
      allow.group("ADMIN").to(["delete"]),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: { defaultAuthorizationMode: "userPool" },
});
