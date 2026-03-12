import React, { memo } from 'react';

const KPICard = memo(function KPICard({ title, value, type = 'default', format = 'currency', className = '' }) {
    const safeValue = isNaN(Number(value)) ? 0 : Number(value);
    const displayValue = format === 'currency'
        ? `₼${safeValue.toLocaleString('az-AZ', { minimumFractionDigits: 2 })}`
        : safeValue.toLocaleString('az-AZ');

    return (
        <div className={`kpi-card animate-fade-in-up ${className}`} data-type={type}>
            <span className="kpi-label">{title}</span>
            <span className="kpi-value">{displayValue}</span>
        </div>
    );
});

export default KPICard;
