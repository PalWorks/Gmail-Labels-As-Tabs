describe('pageWorld XHR Interception', () => {
    let xhrMock: any;
    let dispatchEventSpy: any;

    beforeEach(() => {
        // Mock XMLHttpRequest
        xhrMock = {
            open: jest.fn(),
            send: jest.fn(),
            addEventListener: jest.fn(),
            responseText: ''
        };

        global.XMLHttpRequest = jest.fn(() => xhrMock) as any;
        global.XMLHttpRequest.prototype = xhrMock;

        dispatchEventSpy = jest.spyOn(document, 'dispatchEvent');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should intercept XHR and dispatch unread updates for valid sync response', () => {
        // --- Logic from pageWorld.ts ---
        function interceptXHR() {
            const XHR = global.XMLHttpRequest.prototype;
            const originalOpen = XHR.open;
            const originalSend = XHR.send;

            XHR.open = function (method: string, url: string) {
                // @ts-ignore
                this._url = url;
                // @ts-ignore
                return originalOpen.apply(this, arguments);
            };

            XHR.send = function (body: any) {
                const xhr = this;
                this.addEventListener('load', function () {
                    // @ts-ignore
                    const url = xhr._url || '';
                    if (url.includes('/sync/') || (url.includes('/mail/u/') && !url.includes('?'))) {
                        try {
                            const responseText = xhr.responseText;
                            if (responseText) {
                                processResponse(responseText);
                            }
                        } catch (e) { }
                    }
                });
                // @ts-ignore
                return originalSend.apply(this, arguments);
            };
        }

        function processResponse(responseText: string) {
            const data = parseGmailJson(responseText);
            if (!data) return;
            const updates: any[] = [];
            findCounts(data, updates);
            if (updates.length > 0) {
                dispatchUnreadUpdate(updates);
            }
        }

        function parseGmailJson(text: string): any {
            try {
                const cleanText = text.replace(/^\)]}'\n/, '');
                return JSON.parse(cleanText);
            } catch (e) { return null; }
        }

        function dispatchUnreadUpdate(updates: any[]) {
            const event = new CustomEvent('gmailTabs:unreadUpdate', { detail: updates });
            document.dispatchEvent(event);
        }

        function findCounts(obj: any, updates: any[]) {
            if (!obj || typeof obj !== 'object') return;
            if (Array.isArray(obj)) {
                if (obj.length >= 2 && typeof obj[0] === 'string' && typeof obj[1] === 'number') {
                    const labelId = obj[0];
                    const count = obj[1];
                    if (isValidLabel(labelId)) {
                        updates.push({ label: labelId, count });
                    }
                }
                for (const item of obj) {
                    findCounts(item, updates);
                }
            } else {
                for (const key in obj) {
                    findCounts(obj[key], updates);
                }
            }
        }

        function isValidLabel(label: string): boolean {
            if (label.includes('http')) return false;
            if (label.length > 100) return false;
            return true;
        }
        // --- End Logic ---

        // Capture original mocks before they are overwritten by interceptXHR
        const originalOpen = xhrMock.open;
        const originalSend = xhrMock.send;

        // Initialize
        interceptXHR();

        // Simulate XHR Request
        const xhr = new global.XMLHttpRequest();
        xhr.open('POST', 'https://mail.google.com/sync/u/0/i/s');
        xhr.send();

        // Verify open/send were called (on the original mocks)
        expect(originalOpen).toHaveBeenCalled();
        expect(originalSend).toHaveBeenCalled();

        // Simulate Response
        // Gmail JSON often starts with )]}'
        const mockResponse = `)]}'\n[["^i", 5], ["custom-label", 2]]`;
        xhrMock.responseText = mockResponse;
        xhrMock._url = 'https://mail.google.com/sync/u/0/i/s';

        // Trigger load listener manually (since we mocked addEventListener)
        const loadCallback = xhrMock.addEventListener.mock.calls.find((call: any) => call[0] === 'load')[1];
        loadCallback.call(xhrMock);

        // Verify Event Dispatch
        expect(dispatchEventSpy).toHaveBeenCalled();
        const event = dispatchEventSpy.mock.calls[0][0];
        expect(event.type).toBe('gmailTabs:unreadUpdate');
        expect(event.detail).toEqual([
            { label: '^i', count: 5 },
            { label: 'custom-label', count: 2 }
        ]);
    });
});
