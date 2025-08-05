module.exports = ({ env }) => ({
  "users-permissions": {
    config: {
      jwt: {
        expiresIn: "30d",
      },
      ratelimit: {
        interval: 60000,
        max: 10,
      },
      user: {
        privateAttributes: [
          "password",
          "resetPasswordToken",
          "confirmationToken",
          "email",
        ],
      },
      register: {
        enabled: true,
        defaultRole: "authenticated",
        allowedFields: [
          "username",
          "email",
          "password",
          "Nombre",
          "primerApellido",
          "segundoApellido",
          "telefono",
          "nombreEmpresa",
          "cif",
          "direccionEmpresa",
          "cpEmpresa",
          "localidadEmpresa",
          "provinciaEmpresa",
          "emailEmpresa",
          "telefonoEmpresa",
        ],
      },
    },
  },
});
