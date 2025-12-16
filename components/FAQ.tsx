'use client';

import { useState } from 'react';

interface FAQItem {
    question: string;
    answer: string;
}

const faqData: FAQItem[] = [
    {
        question: 'What is an nPUB key?',
        answer: 'An nPUB key (Nostr Public Key) is a 63-character identifier starting with "npub1". It\'s an alternative way to identify your account instead of using your old username. Example: npub1jlyep8ew8l4gp9vl44dv422czapfeue9s3msxdj6uvnverl3yuyqjs8tqf',
    },
    {
        question: 'How long does the update process take?',
        answer: 'Once you submit your information, it typically takes 24-48 hours to process your username update. You\'ll receive a confirmation email when the process is complete.',
    },
    {
        question: 'What if I made a mistake in my submission?',
        answer: 'You can edit your submission within 24 hours using your tracking ID. After 24 hours, please contact support for assistance.',
    },
    {
        question: 'Can I use either my old username or nPUB key?',
        answer: 'Yes! You can provide either your old Bitmask username OR your nPUB key in Step 1. At least one of these identifiers is required to proceed.',
    },
    {
        question: 'What format should my Bitmask username be in?',
        answer: 'Bitmask usernames can be entered in two formats: the full format (e.g., gideon@bitmask.app) or just the username part (e.g., gideon). Both formats work - the system will match them automatically.',
    },
    {
        question: 'What happens after I submit?',
        answer: 'After submission, you\'ll receive a tracking ID. Your update will be processed within 24-48 hours, and you\'ll receive an email confirmation when complete. You can check your status anytime using the tracking ID.',
    },
    {
        question: 'Is my data secure?',
        answer: 'Yes, all data is encrypted and stored securely. We only use your information for the username update process and never share it with third parties.',
    },
    {
        question: 'How do I contact support?',
        answer: 'If you need assistance, please email support@bitmask.app with your tracking ID (if you have one) and a description of your issue. You can also join our Telegram support group: https://t.me/joinchat/Ajbxchsrj75kMDRi',
    },
];

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleQuestion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>

            <div className="space-y-3">
                {faqData.map((item, index) => (
                    <div
                        key={index}
                        className="border border-gray-800 rounded-lg overflow-hidden"
                    >
                        <button
                            onClick={() => toggleQuestion(index)}
                            className="w-full px-4 py-3 text-left flex justify-between items-center hover:bg-gray-800/50 transition-colors"
                        >
                            <span className="font-semibold text-white">{item.question}</span>
                            <span className={`text-accent transition-transform ${openIndex === index ? 'rotate-180' : ''}`}>
                                ▼
                            </span>
                        </button>

                        {openIndex === index && (
                            <div className="px-4 py-3 bg-gray-800/30 border-t border-gray-800 animate-fade-in">
                                <p className="text-gray-300 text-sm leading-relaxed">{item.answer}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-800 text-center">
                <p className="text-gray-400 text-sm">
                    Still have questions?{' '}
                    <a
                        href="mailto:support@bitmask.app"
                        className="text-accent hover:underline"
                    >
                        Contact Support
                    </a>
                </p>
            </div>
        </div>
    );
}
