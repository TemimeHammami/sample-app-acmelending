export const serverProd = {
    credentials: {
        access_token: ''
    },
    application: {
          secure: true,
          host: '10.21.62.49',
          port: 8080,
          path: '/zoomdata'
    },
    oauthOptions: {
        redirect_uri: "10.21.62.49:8080/acmelending",
        auth_uri: "10.21.62.49:8080/zoomdata",
        scope: ['read']
    }
};
