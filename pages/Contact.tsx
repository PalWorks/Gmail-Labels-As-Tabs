import React, { useEffect } from 'react';
import { MessageCircle } from 'lucide-react';

export const Contact: React.FC = () => {
    useEffect(() => {
        document.title = 'Contact Us | Gmail Labels as Tabs';

        // Load Tally embed script
        const scriptSrc = "https://tally.so/widgets/embed.js";
        const loadTally = () => {
            // @ts-ignore
            if (typeof Tally !== 'undefined') {
                // @ts-ignore
                Tally.loadEmbeds();
            } else {
                document.querySelectorAll("iframe[data-tally-src]:not([src])").forEach((e) => {
                    // @ts-ignore
                    e.src = (e as HTMLIFrameElement).dataset.tallySrc;
                });
            }
        };

        if (typeof window !== 'undefined') {
            if (document.querySelector(`script[src="${scriptSrc}"]`)) {
                loadTally();
            } else {
                const script = document.createElement("script");
                script.src = scriptSrc;
                script.onload = loadTally;
                script.onerror = loadTally;
                document.body.appendChild(script);
            }
        }
    }, []);

    return (
        <div className="bg-[#F6F8FC] min-h-screen pt-24 pb-16">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#D3E3FD] rounded-full mb-6">
                        <MessageCircle className="w-8 h-8 text-[#0B57D0]" />
                    </div>
                    <h1 className="text-3xl font-normal text-[#1F1F1F] mb-4">Get in Touch</h1>
                    <p className="text-lg text-[#444746]">Have a question, feature request, or feedback? We would love to hear from you.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-[#E1E3E1] p-6 md:p-10">
                    <iframe
                        data-tally-src="https://tally.so/embed/Me17aA?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
                        loading="lazy"
                        width="100%"
                        height="596"
                        frameBorder="0"
                        title="Get in Touch"
                        className="w-full"
                    ></iframe>
                </div>
            </div>
        </div>
    );
};
