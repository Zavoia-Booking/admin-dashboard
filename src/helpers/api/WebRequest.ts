export interface RequestResponse {
    response: Response;
    data: any;
}

class WebRequest {
    private accessToken: string = '';

    private contentType: string = 'application/json';

    public GET(url: string) {
        return this.call({ url, type: 'GET', contentType: this.contentType });
    }
    public POST(url: string, data: any) {
        return this.call({ url, type: 'POST', contentType: this.contentType, data });
    }
    public PUT(url: string, data: any) {
        return this.call({ url, type: 'PUT', contentType: this.contentType, data });
    }
    public PATCH(url: string, data: any) {
        return this.call({ url, type: 'PATCH', contentType: this.contentType, data });
    }
    public DELETE(url: string) {
        return this.call({ url, type: 'DELETE', contentType: this.contentType });
    }
    public MakeRequest(url: string, method: string, data: any, headers: Record<string, any>, noJson?: boolean, formDataRequest?: boolean) {
        const requestInit: RequestInit = {
            method,
            headers: {
                Authorization: `${this.accessToken}`,
                ...headers,
            },
            credentials: 'same-origin',
        };
        if (['GET', 'HEAD'].indexOf(method.toUpperCase()) === -1) {
            requestInit.body = formDataRequest ? data : JSON.stringify(data);
        }
        return new Promise((resolve, reject) => {
            fetch(url, requestInit)
                .then((res) => {
                    if (noJson) {
                        res.text()
                            .then((data) => {
                                const request: RequestResponse = { response: res, data };
                                resolve(request);
                            })
                            .catch((err) => {
                                reject(err);
                            });
                        return;
                    }
                    res.json()
                        .then((data) => {
                            const request: RequestResponse = { response: res, data };
                            resolve(request);
                        })
                        .catch((err) => {
                            reject(err);
                        });
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }
    public SetAccessToken(token: string) {
        this.accessToken = `Bearer ${token}`;
    }

    public ClearAccessToken() {
        this.accessToken = '';
    }

    public GetAccessToken() {
        return this.accessToken;
    }

    private call(payload: any) {
        const requestInit: RequestInit = {
            method: payload.type,
            headers: {
                'Content-Type': payload.contentType,
                'Authorization': `${this.accessToken}`,
            },
            credentials: 'same-origin',
        };
        if (['GET', 'HEAD'].indexOf(payload.type.toUpperCase()) === -1) {
            requestInit.body = JSON.stringify(payload.data);
        }
        return new Promise((resolve, reject) => {
            fetch(payload.url, requestInit)
                .then((res) => {
                    res.json()
                        .then((data) => {
                            const request: RequestResponse = { response: res, data };
                            resolve(request);
                        })
                        .catch((err) => {
                            reject(err);
                        });
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }
}

const webRequestInstance = new WebRequest();

export default webRequestInstance;
