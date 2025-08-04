"use strict";

module.exports = (plugin) => {
  const sanitizeOutput = (user) => {
    const {
      password,
      resetPasswordToken,
      confirmationToken,
      ...sanitizedUser
    } = user;
    return sanitizedUser;
  };

  plugin.controllers.user.me = async (ctx) => {
    if (!ctx.state.user) {
      return ctx.unauthorized();
    }
    const user = await strapi.entityService.findOne(
      "plugin::users-permissions.user",
      ctx.state.user.id,
      { populate: ["datosFacturacion"] }
    );

    ctx.body = sanitizeOutput(user);
  };

  const sanitizeUser = (user) => {
    const {
      password,
      resetPasswordToken,
      confirmationToken,
      ...sanitizedUser
    } = user;
    return sanitizedUser;
  };

  plugin.controllers.auth.register = async (ctx) => {
    const pluginStore = await strapi.store({
      type: "plugin",
      name: "users-permissions",
    });
    const settings = await pluginStore.get({ key: "advanced" });

    if (!settings.allow_register) {
      return ctx.badRequest("Register action is currently disabled");
    }

    const params = {
      ...ctx.request.body,
      provider: "local",
    };

    // Generar username si no se proporciona
    if (!params.username) {
      params.username = params.email.split("@")[0];
    }

    try {
      const user = await strapi.service("plugin::users-permissions.user").add({
        ...params,
        role: settings.default_role,
        email: params.email.toLowerCase(),
        username: params.username,
        confirmed: true,
      });

      const sanitizedUser = sanitizeUser(user);

      if (settings.email_confirmation) {
        try {
          await strapi
            .plugin("users-permissions")
            .service("user")
            .sendConfirmationEmail(sanitizedUser);
        } catch (err) {
          return ctx.badRequest(err.message);
        }

        return ctx.send({ user: sanitizedUser });
      }

      const jwt = strapi
        .plugin("users-permissions")
        .service("jwt")
        .issue({ id: user.id });

      return ctx.send({
        jwt,
        user: sanitizedUser,
      });
    } catch (err) {
      return ctx.badRequest(err.message);
    }
  };

  return plugin;
};
