export default {
  routes: [
    {
      method: "PUT",
      path: "/user-extended/:id",
      handler: "user-extended.update",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
