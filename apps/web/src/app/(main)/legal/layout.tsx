export default function LegalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="container mx-auto px-4 py-20 max-w-4xl">
            <div className="prose prose-invert prose-blue max-w-none">
                {children}
            </div>
        </div>
    );
}
