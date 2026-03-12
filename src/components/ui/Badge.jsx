export default function Badge({ children, variant = 'neutral', className = '' }) {
    // variants: success, danger, warning, info, neutral
    return (
        <span className={`badge badge-${variant} ${className}`}>
            {children}
        </span>
    );
}
