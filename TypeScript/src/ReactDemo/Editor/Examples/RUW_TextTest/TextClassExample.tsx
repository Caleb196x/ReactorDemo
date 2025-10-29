import React from 'react';
import './TextTest.css';

type TextAlign = 'left' | 'center' | 'right';

const ALIGNMENT_ORDER: TextAlign[] = ['left', 'center', 'right'];

interface TextClassState {
    content: string;
    alignmentIndex: number;
    lineHeight: number;
    isUppercase: boolean;
    isDisabled: boolean;
    isVisible: boolean;
    useChildren: boolean;
    accentColor: string;
    updateCount: number;
}

export class TextClassExample extends React.Component<unknown, TextClassState> {
    state: TextClassState = {
        content: 'Class based Text example',
        alignmentIndex: 0,
        lineHeight: 1.2,
        isUppercase: false,
        isDisabled: false,
        isVisible: true,
        useChildren: false,
        accentColor: '#7fffd4',
        updateCount: 0,
    };

    handleContentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        this.setState((prev) => ({
            content: value,
            updateCount: prev.updateCount + 1,
        }));
    };

    toggleAlignment = () => {
        this.setState((prev) => ({
            alignmentIndex: (prev.alignmentIndex + 1) % ALIGNMENT_ORDER.length,
        }));
    };

    toggleUppercase = () => {
        this.setState((prev) => ({
            isUppercase: !prev.isUppercase,
        }));
    };

    toggleDisabled = () => {
        this.setState((prev) => ({
            isDisabled: !prev.isDisabled,
        }));
    };

    toggleVisibility = () => {
        this.setState((prev) => ({
            isVisible: !prev.isVisible,
        }));
    };

    toggleUsageMode = () => {
        this.setState((prev) => ({
            useChildren: !prev.useChildren,
        }));
    };

    cycleLineHeight = () => {
        this.setState((prev) => ({
            lineHeight: prev.lineHeight > 1.8 ? 1.1 : parseFloat((prev.lineHeight + 0.2).toFixed(1)),
        }));
    };

    cycleAccentColor = () => {
        this.setState((prev) => ({
            accentColor:
                prev.accentColor === '#7fffd4'
                    ? '#ff8a80'
                    : prev.accentColor === '#ff8a80'
                    ? '#ffcd38'
                    : '#7fffd4',
        }));
    };

    render() {
        const {
            content,
            alignmentIndex,
            lineHeight,
            isUppercase,
            isDisabled,
            isVisible,
            useChildren,
            accentColor,
            updateCount,
        } = this.state;

        const alignment = ALIGNMENT_ORDER[alignmentIndex];
        const derivedContent = `${content} (updates ${updateCount})`;

        return (
            <div className="text-demo-wrapper">
                <text className="text-demo-header" text="Text Component (class demo)" />

                <text
                    className="text-outline text-highlight"
                    text={useChildren ? undefined : derivedContent}
                    toolTip={`Static tooltip: ${derivedContent}`}
                    toolTipBinding={() => `Dynamic tooltip (render ${updateCount})`}
                    title={`Alignment: ${alignment}`}
                    titleBinding={() => `Alignment: ${alignment} | line-height: ${lineHeight.toFixed(1)}`}
                    disable={isDisabled}
                    disableBinding={() => isDisabled}
                    visibilityBinding={() => (isVisible ? 'visible' : 'hidden')}
                    pixelSnapping={true}
                    style={{
                        fontSize: '24px',
                        fontWeight: isUppercase ? '800' : '600',
                        letterSpacing: '1.2px',
                        wordSpacing: '4px',
                        lineHeight: lineHeight.toString(),
                        textAlign: alignment,
                        textTransform: isUppercase ? 'uppercase' : 'none',
                        cursor: 'text',
                        textShadow: '0 0 6px rgba(0, 0, 0, 0.55)',
                        color: accentColor,
                    }}
                >
                    {useChildren ? derivedContent : null}
                </text>

                <text
                    className="text-secondary text-with-shadow"
                    text="A secondary text instance using className styles"
                    style={{
                        fontSize: '18px',
                        fontStyle: 'italic',
                        lineHeight: '1.4',
                        textAlign: 'left',
                    }}
                />

                <text
                    className="text-outline text-ref-style"
                    text={`Inline styling with outline and alignment ${alignment}`}
                    style={{
                        textAlign: 'center',
                        fontFamily: '"Roboto", "monospace"',
                        outline: '1px solid rgba(255, 255, 255, 0.5)',
                        padding: '6px 8px',
                        lineHeight: '1.5',
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                    }}
                />

                <text
                    className="text-meta"
                    text={`disabled: ${isDisabled ? 'yes' : 'no'} | visible: ${isVisible ? 'yes' : 'no'} | using children: ${
                        useChildren ? 'yes' : 'no'
                    }`}
                    style={{
                        textAlign: 'left',
                        fontSize: '14px',
                        lineHeight: '1.3',
                    }}
                />

                <div className="text-controls">
                    <input
                        className="text-input"
                        value={content}
                        onChange={this.handleContentChange}
                        placeholder="Update primary content"
                    />
                    <button className="text-toggle" onClick={this.toggleAlignment}>
                        Toggle alignment (current: {alignment})
                    </button>
                    <button className="text-toggle" onClick={this.toggleUppercase}>
                        {isUppercase ? 'Disable uppercase' : 'Uppercase text'}
                    </button>
                    <button className="text-toggle" onClick={this.cycleLineHeight}>
                        Change line height ({lineHeight.toFixed(1)})
                    </button>
                    <button className="text-toggle" onClick={this.toggleDisabled}>
                        {isDisabled ? 'Enable text' : 'Disable text'}
                    </button>
                    <button className="text-toggle" onClick={this.toggleVisibility}>
                        {isVisible ? 'Hide text' : 'Show text'}
                    </button>
                    <button className="text-toggle" onClick={this.toggleUsageMode}>
                        {useChildren ? 'Use text prop' : 'Use children'}
                    </button>
                    <button className="text-toggle" onClick={this.cycleAccentColor}>
                        Cycle accent color
                    </button>
                </div>
            </div>
        );
    }
}

export default TextClassExample;
