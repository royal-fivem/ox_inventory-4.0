import React, { useEffect, useCallback } from 'react';

interface Props {
    activeIndex: number;
    setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
    hasExperience?: boolean;
}

const EXPERIENCE_INDEX = 3;

const ALL_PAGES = [
    { label: 'Inventory', index: 0 },
    { label: 'Health & Injuries', index: 1 },
    { label: 'Crafting', index: 2 },
    { label: 'Experience', index: EXPERIENCE_INDEX },
];

const InventoryPanelSwitcher: React.FC<Props> = ({ activeIndex, setActiveIndex, hasExperience = false }) => {
    const pages = ALL_PAGES.filter((p) => p.index !== EXPERIENCE_INDEX || hasExperience);
    const step = useCallback(
        (dir: number) => {
            setActiveIndex((prev) => {
                const order = ALL_PAGES.filter((p) => p.index !== EXPERIENCE_INDEX || hasExperience).map(
                    (p) => p.index
                );
                const cur = order.indexOf(prev);
                const base = cur === -1 ? 0 : cur;
                return order[(base + dir + order.length) % order.length];
            });
        },
        [hasExperience, setActiveIndex]
    );

    const goBackward = useCallback(() => step(-1), [step]);
    const goForward = useCallback(() => step(1), [step]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return;

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
                {pages.map((page) => (
                    <button
                        key={page.index}
                        className={`panel-switch-tab ${page.index === activeIndex ? 'active' : ''}`}
                        onClick={() => setActiveIndex(page.index)}
                    >
                        {page.label}
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
