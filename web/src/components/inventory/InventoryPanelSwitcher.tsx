import React, { useEffect, useCallback } from 'react';

interface Props {
    activeIndex: number;
    setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
}

const PAGES = ['Inventory', 'Health & Injuries', 'Crafting', 'Experience'];

const InventoryPanelSwitcher: React.FC<Props> = ({ activeIndex, setActiveIndex }) => {
    // Functional updates so we always step from the current page, never a
    // stale closure value (which could otherwise double-step / skip a page).
    const goBackward = useCallback(() => {
        setActiveIndex((prev) => (prev - 1 + PAGES.length) % PAGES.length);
    }, [setActiveIndex]);

    const goForward = useCallback(() => {
        setActiveIndex((prev) => (prev + 1) % PAGES.length);
    }, [setActiveIndex]);

    // keyboard shortcuts (Q = backward, E = forward). Registered once; ignores
    // auto-repeat so holding the key doesn't fly through multiple pages.
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return;

            // don't switch pages while typing in a search/text field
            const target = e.target as HTMLElement | null;
            if (
                target &&
                (target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.isContentEditable)
            )
                return;

            const key = e.key.toLowerCase();
            if (key === 'q') goBackward();
            else if (key === 'e') goForward();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goBackward, goForward]);

    return (
        <div
            className="panel-switcher"
            style={{
                position: 'absolute',
                left: '50%',
                top: '7vh',
                transform: 'translateX(-50%)',
                zIndex: 20,
            }}
        >
            <button className="panel-switch-key" onClick={goBackward}>
                <span className="panel-switch-key-letter left"><span>Q</span></span>
            </button>

            <div className="panel-switch-tabs">
                {PAGES.map((page, i) => (
                    <button
                        key={page}
                        className={`panel-switch-tab ${i === activeIndex ? 'active' : ''}`}
                        onClick={() => setActiveIndex(i)}
                    >
                        {page}
                    </button>
                ))}
            </div>

            <button className="panel-switch-key" onClick={goForward}>
                <span className="panel-switch-key-letter right"><span>E</span></span>
            </button>
        </div>
    );
};

export default InventoryPanelSwitcher;
