import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "./AuthContext";

export const TenantContext = createContext(null);

export function TenantProvider({ children }) {
    const { user, isAuthenticated } = useAuth();
    const [activeTenant, setActiveTenant] = useState(null);
    const [tenants, setTenants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchTenants() {
            if (!isAuthenticated || !user) {
                setTenants([]);
                setActiveTenant(null);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                // Determine which tenants the user belongs to (requires active RLS / linking table in DB)
                const { data, error } = await supabase
                    .from('tenant_users')
                    .select('tenant_id, role, tenants ( id, name, domain )')
                    .eq('user_id', user.id);

                if (error) {
                    console.error("Error fetching tenants:", error);
                    setTenants([]);
                    setIsLoading(false);
                    return;
                }

                if (data && data.length > 0) {
                    const availableTenants = data.map(tu => ({
                        ...tu.tenants,
                        role: tu.role
                    }));
                    setTenants(availableTenants);
                    // Select first tenant by default or load from preference
                    const savedTenantId = localStorage.getItem("zntr_active_tenant");
                    const found = availableTenants.find(t => t.id === savedTenantId);
                    if (found) {
                        setActiveTenant(found);
                    } else {
                        setActiveTenant(availableTenants[0]);
                        localStorage.setItem("zntr_active_tenant", availableTenants[0].id);
                    }
                } else {
                    // Edge case: Authenticated user but no tenant assigned yet.
                    setTenants([]);
                    setActiveTenant(null);
                }
            } catch (err) {
                console.error("Failed to load tenant info.", err);
            }
            setIsLoading(false);
        }

        fetchTenants();
    }, [isAuthenticated, user]);

    const switchTenant = (tenantId) => {
        const tenant = tenants.find(t => t.id === tenantId);
        if (tenant) {
            setActiveTenant(tenant);
            localStorage.setItem("zntr_active_tenant", tenant.id);
            // Optionally, we might want to force a refetch or reload of the dashboard state here
            // Because the Tenant is the fundamental boundary for all data.
            window.location.reload();
        }
    };

    return (
        <TenantContext.Provider value={{ activeTenant, tenants, switchTenant, isLoading }}>
            {children}
        </TenantContext.Provider>
    );
}

export function useTenant() {
    return useContext(TenantContext);
}
