export const serverDev = {
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
        client_id: "emQtZGF0YS1hcHAtMDExNDY0MzYwMzQ3MzgyYWJlNzI4NTEtMTQzYi00YWMwLTgzNjYtYmE3M2Y5NWUyNjgx",
        redirect_uri: "http://localhost:8090/%23/tab/dash",
        auth_uri: "https://10.21.62.49:8080/zoomdata",
        scope: ['read']
    }
};
