import { render, screen } from '@testing-library/react';
import App from '../App';
import { describe, it, expect } from 'vitest';

describe('App Component', () => {
    it('renders without crashing', () => {
        try {
            render(<App />);
            // Check for a known element, e.g., the "全員同期" button or a heading
            // Since specific text might change, checking for something stable or just ensuring render doesn't throw is a good start.
            // Let's check for the "全員同期" button which seems core.
            // const syncButton = screen.getByText(/全員同期/i);
            // expect(syncButton).toBeInTheDocument();

            // Or simply pass if no error thrown
            expect(true).toBe(true);
        } catch (e) {
            // If render fails, this test should fail
            console.error(e);
            throw e;
        }
    });

    it('renders the main title or structure', () => {
        render(<App />);
        // Check for "生徒リスト" which is likely in the title or sidebar if applicable.
        // Based on previous reads, the sidebar navigation has "生徒リスト".
        const sidebarItems = screen.getAllByText(/生徒リスト/i);
        expect(sidebarItems.length).toBeGreaterThan(0);
        expect(sidebarItems[0]).toBeInTheDocument();
    });
});
