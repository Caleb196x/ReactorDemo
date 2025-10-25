import * as React from "react";

// 类组件版简化游戏UI工具
interface GameUIToolState {
  elements: Array<{ id: number; name: string; type: string; x: number; y: number; w: number; h: number; color: string }>;
  activeId: number | null;
  zoom: number;
  drag: null | { startX: number; startY: number };
}

export default class GameUIToolClass extends React.Component<{}, GameUIToolState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      elements: [
        { id: 1, name: "按钮", type: "button", x: 100, y: 100, w: 120, h: 40, color: "#3b82f6" },
        { id: 2, name: "面板", type: "panel", x: 260, y: 80, w: 200, h: 120, color: "#1e293b" }
      ],
      activeId: null,
      zoom: 100,
      drag: null,
    };
  }

  addElement = (type) => {
    const id = Date.now();
    const newEl = {
      id,
      name: type,
      type,
      x: 50,
      y: 50,
      w: 100,
      h: 60,
      color: type === 'button' ? '#22c55e' : '#374151',
    };
    this.setState((prev) => ({ elements: [...prev.elements, newEl], activeId: id }));
  };

  setActive = (id) => {
    this.setState({ activeId: id });
  };

  updateActive = (key, value) => {
    const { elements, activeId } = this.state;
    this.setState({
      elements: elements.map((el) => (el.id === activeId ? { ...el, [key]: value } : el)),
    });
  };

  deleteActive = () => {
    const { elements, activeId } = this.state;
    this.setState({ elements: elements.filter((e) => e.id !== activeId), activeId: null });
  };

  onElementMove = (id, x, y) => {
    this.setState((prev) => ({
      elements: prev.elements.map((e) => (e.id === id ? { ...e, x, y } : e)),
    }));
  };

  render() {
    const { elements, activeId, zoom } = this.state;
    const active = elements.find((e) => e.id === activeId);
    const zoomFactor = zoom / 100;

    return (
      <div style={{ display: 'flex', objectFit: 'fill', height: '100vh', fontFamily: 'sans-serif' }}>
        {/* 左侧组件面板 */}
        <div style={{ flexDirection: 'column', width: '200px', borderRight: '1px solid #ccc', padding: '8px' }}>
          <h3>组件库</h3>
          <button onClick={() => this.addElement('button')}>添加按钮</button>
          <button onClick={() => this.addElement('panel')} style={{ marginLeft: '8px' }}>添加面板</button>
          <div style={{ height: '1px', backgroundColor: '#ccc', margin: '12px 0' }} />
          <h4>元素列表</h4>
          {elements.map((e) => (
            <div key={e.id} onClick={() => this.setActive(e.id)}
              style={{ padding: '4px', marginBottom: '4px', borderRadius: '4px', cursor: 'pointer',
                background: activeId === e.id ? '#dbeafe' : 'transparent' }}>
              {e.name}
            </div>
          ))}
        </div>

        {/* 中间画布 */}
        <div style={{ flexDirection: 'row', flex: 1, position: 'relative', overflow: 'hidden', background: '#0f172a' }}>
          <div style={{  position: 'absolute', top: '0px', left: '0px', right: '0px', bottom: '0px', pointerEvents: 'none', backgroundColor: 'rgba(255,255,255,0.03)' }} />
          <div style={{ position: 'relative', transform: `scale(${zoomFactor})`, transformOrigin: 'top left', width: '100%', height: '100%' }}>
            {elements.map((e) => (
              <DraggableBox
                key={e.id}
                el={e}
                active={e.id === activeId}
                onSelect={() => this.setActive(e.id)}
                onMove={(x, y) => this.onElementMove(e.id, x, y)}
              />
            ))}
          </div>
        </div>

        {/* 右侧属性编辑 */}
        <div style={{flexDirection: 'column', width: '240px', borderLeft: '1px solid #ccc', padding: '8px' }}>
          <h3>属性面板</h3>
          {active ? (
            <>
              <div>类型：{active.type}</div>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                名称：
                <input value={active.name} onChange={(e) => this.updateActive('name', e.target.value)} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                X：
                <input type="number" value={active.x} onChange={(e) => this.updateActive('x', Number(e.target.value))} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                Y：
                <input type="number" value={active.y} onChange={(e) => this.updateActive('y', Number(e.target.value))} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                宽：
                <input type="number" value={active.w} onChange={(e) => this.updateActive('w', Number(e.target.value))} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                高：
                <input type="number" value={active.h} onChange={(e) => this.updateActive('h', Number(e.target.value))} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                颜色：
                <input type="color" value={active.color} onChange={(e) => this.updateActive('color', e.target.value)} />
              </label>
              <div style={{ marginTop: '8px' }}>
                <button onClick={this.deleteActive} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px' }}>删除</button>
              </div>
            </>
          ) : <div>未选中元素</div>}
          <div style={{ height: '1px', backgroundColor: '#ccc', margin: '12px 0' }} />
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            缩放：
            <input type="range" min={50} max={200} value={zoom} onChange={(e) => this.setState({ zoom: Number(e.target.value) })} />
          </label>
        </div>
      </div>
    );
  }
}

interface DraggableBoxProps {
  el: { id: number; name: string; type: string; x: number; y: number; w: number; h: number; color: string };
  active: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
}

class DraggableBox extends React.Component<DraggableBoxProps, { drag: null | { startX: number; startY: number } }> {
  constructor(props: DraggableBoxProps) {
    super(props);
    this.state = { drag: null };
  }

  onMouseDown = (e) => {
    e.stopPropagation();
    this.props.onSelect();
    this.setState({ drag: { startX: e.clientX, startY: e.clientY } });
  };

  onMouseMove = (e) => {
    const { drag } = this.state;
    if (!drag) return;
    const { el, onMove } = this.props;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    onMove(el.x + dx, el.y + dy);
  };

  onMouseUp = () => {
    this.setState({ drag: null });
  };

  render() {
    const { el, active } = this.props;
    return (
      <div
        onMouseDown={this.onMouseDown}
        onMouseMove={this.onMouseMove}
        onMouseUp={this.onMouseUp}
        style={{
          position: 'absolute',
          left: `${el.x}px`,
          top: `${el.y}px`,
          width: `${el.w}px`,
          height: `${el.h}px`,
          background: el.color,
          border: active ? '2px solid #60a5fa' : '1px solid rgba(255,255,255,0.3)',
          borderRadius: '6px',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'move',
          userSelect: 'none',
        }}
      >
        {el.type === 'button' ? 'Button' : 'Panel'}
      </div>
    );
  }
}
