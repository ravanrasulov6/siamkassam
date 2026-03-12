import { useState, useRef, useEffect } from 'react';

/**
 * Reusable DataTable component
 * Features loading state, empty state, row rendering, and sticky header
 */
export default function DataTable({
    columns,
    data,
    loading,
    keyField = 'id',
    onRowClick,
    emptyStateText = 'Heç bir məlumat tapılmadı',
    emptyStateAction,
}) {
    if (loading) {
        return (
            <div className="table-container" style={{ overflow: 'hidden' }}>
                <table className="table">
                    <thead>
                        <tr>
                            {columns.map((col, i) => <th key={i} style={{ width: col.width }}>{col.header}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {[...Array(5)].map((_, i) => (
                            <tr key={i}>
                                {columns.map((_, j) => (
                                    <td key={j}><div className="skeleton" style={{ height: '20px', width: '80%' }}></div></td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <h3 className="empty-state-title">{emptyStateText}</h3>
                {emptyStateAction && (
                    <div style={{ marginTop: 'var(--space-4)' }}>
                        {emptyStateAction}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="table-container" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            <table className="table" style={{ position: 'relative' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 'var(--z-sticky)' }}>
                    <tr>
                        {columns.map((col, index) => (
                            <th
                                key={index}
                                style={{
                                    width: col.width,
                                    textAlign: col.align || 'left',
                                }}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row) => (
                        <tr
                            key={row[keyField]}
                            onClick={() => onRowClick && onRowClick(row)}
                            style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                        >
                            {columns.map((col, index) => (
                                <td
                                    key={index}
                                    style={{ textAlign: col.align || 'left' }}
                                >
                                    {col.render ? col.render(row) : row[col.field]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div >
    );
}
