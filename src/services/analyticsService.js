import { supabase } from './supabaseClient';

/**
 * Analytics Service (Pilot Phase 5)
 * Minimum viable instrumentation to detect friction, activation, and usage patterns.
 * In a pilot phase, writing to console and a lightweight Supabase table is sufficient.
 */

const SESSION_UID_KEY = "zntr_pilot_uid";

function getOrSetPilotUid() {
    let uid = localStorage.getItem(SESSION_UID_KEY);
    if (!uid) {
        uid = `plt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem(SESSION_UID_KEY, uid);
    }
    return uid;
}

/**
 * Log a generic pilot event.
 * @param {string} eventName - e.g., 'integration_connected', 'recommendation_clicked'
 * @param {object} metadata - Any relevant extra context
 */
export async function logPilotEvent(eventName, metadata = {}) {
    const payload = {
        event_name: eventName,
        session_uid: getOrSetPilotUid(),
        timestamp: new Date().toISOString(),
        url: window.location.pathname,
        ...metadata
    };

    // 1. Log to console for local debugging and immediate consultant visibility
    console.log(`[Zentra Pilot Analytics] 📊 ${eventName}`, payload);

    // 2. Safely attempt to persist to Supabase if the table exists
    try {
        if (!supabase) return;

        // We do not wait for this to finish to avoid blocking UI
        supabase.from('pilot_events_log').insert([{
            event_name: eventName,
            session_uid: payload.session_uid,
            metadata: metadata,
            url: payload.url
        }]).then(({ error }) => {
            if (error && error.code !== '42P01') {
                // Ignore 42P01 (table does not exist) as the consultant may not have run migrations yet
                console.warn("[Analytics Warning] Could not persist event:", error);
            }
        });
    } catch (err) {
        // Ignore errors, telemetry must not break the app
    }
}

/**
 * Track technical errors explicitly (Phase 7 Telemetry)
 */
export async function logError(errorSource, errorMessage, metadata = {}) {
    const payload = {
        event_name: 'technical_error',
        session_uid: getOrSetPilotUid(),
        timestamp: new Date().toISOString(),
        url: window.location.pathname,
        error_message: errorMessage,
        metadata: { source: errorSource, ...metadata }
    };

    console.error(`[Zentra Error Telemetry] 🚨 ${errorSource}: ${errorMessage}`, payload);

    try {
        if (!supabase) return;
        supabase.from('pilot_events_log').insert([{
            event_name: payload.event_name,
            session_uid: payload.session_uid,
            error_message: payload.error_message,
            metadata: payload.metadata,
            url: payload.url
        }]).then(({ error }) => {
            if (error && error.code !== '42P01') console.warn("Failed to persist error log:", error);
        });
    } catch (err) {
        // Fallback silently
    }
}

/**
 * Track page views when user navigates.
 * @param {string} pageId - The internal ID of the page loaded
 */
export function trackPageView(pageId) {
    if (!pageId) return;
    logPilotEvent('page_view', { page_id: pageId });
}

export function trackFriction(component, errorContext) {
    logPilotEvent('friction_detected', { component, error_context: errorContext });
}
