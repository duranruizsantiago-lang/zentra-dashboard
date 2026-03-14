import { useState, useEffect } from "react";
import { I } from "./Shared";

export default function DataTable({ columns, data, onRowClick }) {
    const [sortCol, setSortCol] = useState(null);
    const [sortDir, setSortDir] = useState("asc");
    const [page, setPage] = useState(0);
    const perPage = 10;

    // Reset to first page when data changes (e.g. after filtering)
    useEffect(() => { setPage(0); }, [data]);

    const handleSort = (col) => {
        if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortCol(col); setSortDir("asc"); }
    };

    let sorted = [...data];
    if (sortCol) {
        sorted.sort((a, b) => {
            const va = a[sortCol], vb = b[sortCol];
            if (typeof va === "number") return sortDir === "asc" ? va - vb : vb - va;
            return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
        });
    }

    const totalPages = Math.ceil(sorted.length / perPage);
    const pageData = sorted.slice(page * perPage, (page + 1) * perPage);

    return (
        <div className="glass-card" style={{ overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                        <tr>
                            {columns.map(col => (
                                <th key={col.key} onClick={() => col.sortable !== false && handleSort(col.key)}
                                    style={{ padding: "12px 16px", textAlign: col.align || "left", color: "var(--text-muted)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid rgba(14,165,233,0.08)", cursor: col.sortable !== false ? "pointer" : "default", whiteSpace: "nowrap", userSelect: "none", background: "rgba(14,165,233,0.02)" }}>
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                        {col.label}
                                        {sortCol === col.key && (sortDir === "asc" ? I.arrowUp : I.arrowDown)}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {pageData.map((row, i) => (
                            <tr key={i} onClick={() => onRowClick?.(row)}
                                className="table-row-hover"
                                style={{ borderBottom: "1px solid rgba(14,165,233,0.04)", cursor: onRowClick ? "pointer" : "default" }}>
                                {columns.map(col => (
                                    <td key={col.key} style={{ padding: "12px 16px", color: "var(--text-primary)", textAlign: col.align || "left", whiteSpace: "nowrap" }}>
                                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: "1px solid rgba(14,165,233,0.06)" }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{sorted.length} resultados</span>
                    <div style={{ display: "flex", gap: 4 }}>
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button key={i} onClick={() => setPage(i)}
                                className={i === page ? "btn-gold" : "btn-ghost"}
                                style={{ width: 30, height: 30, padding: 0, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {i + 1}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
