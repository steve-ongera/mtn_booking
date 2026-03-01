// frontend/src/pages/admin/AdminSeatLayout.jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminMatatus } from '../../services/api';

// ── Seat types the admin can place ───────────────────────────
const PALETTE = [
  { key: 'window',    label: 'Win',  bg: '#dcfce7', color: '#15803d', border: '#86efac', tip: 'Window Seat' },
  { key: 'aisle',     label: 'Asl',  bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd', tip: 'Aisle Seat' },
  { key: 'front',     label: 'Fnt',  bg: '#fef9c3', color: '#854d0e', border: '#fde047', tip: 'Front Passenger' },
  { key: 'driver',    label: 'DRV',  bg: '#eff6ff',  color: '#1e40af', border: '#bfdbfe', tip: 'Driver', special: 'is_driver_seat' },
  { key: 'conductor', label: 'COND', bg: '#f3e8ff', color: '#7c3aed', border: '#d8b4fe', tip: 'Conductor', special: 'is_conductor_seat' },
  { key: 'gap',       label: '  ',   bg: 'transparent', color: 'transparent', border: 'var(--gray-200)', tip: 'Aisle Gap', special: 'is_aisle_gap' },
];

const ROWS = 8;
const COLS = 5;

function newSeat(row, col) {
  return { seat_number: '', seat_class: 'window', row_number: row, column_number: col, is_driver_seat: false, is_conductor_seat: false, is_aisle_gap: false, bg_color: '', text_color: '', custom_label: '', extra_padding: 0, is_active: true, row_span: 1, col_span: 1 };
}

function getSeatStyle(seat) {
  if (seat.is_driver_seat)    return PALETTE[3];
  if (seat.is_conductor_seat) return PALETTE[4];
  if (seat.is_aisle_gap)      return PALETTE[5];
  const p = PALETTE.find(p => p.key === seat.seat_class) || PALETTE[0];
  return p;
}

export default function AdminSeatLayout() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [matatu, setMatatu]       = useState(null);
  const [grid, setGrid]           = useState([]);   // flat array of seat objects
  const [selected, setSelected]   = useState(null); // {row, col}
  const [activeTool, setActiveTool] = useState('window');
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [loading, setLoading]     = useState(true);
  const [rows, setRows]           = useState(ROWS);
  const [cols, setCols]           = useState(COLS);
  const [seatCounter, setSeatCounter] = useState(1);

  // Load existing layout
  useEffect(() => {
    adminMatatus.get(slug).then(m => {
      setMatatu(m);
      if (m.seats?.length) {
        setGrid(m.seats.map(s => ({ ...s })));
        const maxR = Math.max(...m.seats.map(s => s.row_number));
        const maxC = Math.max(...m.seats.map(s => s.column_number));
        setRows(Math.max(maxR, ROWS));
        setCols(Math.max(maxC, COLS));
        // find max seat number
        const nums = m.seats.map(s => parseInt(s.seat_number)).filter(n => !isNaN(n));
        if (nums.length) setSeatCounter(Math.max(...nums) + 1);
      } else {
        setGrid([]);
      }
      setLoading(false);
    }).catch(() => { setLoading(false); });
  }, [slug]);

  const getSeat = (row, col) => grid.find(s => s.row_number === row && s.column_number === col);

  const paintCell = (row, col) => {
    const pal = PALETTE.find(p => p.key === activeTool);
    if (!pal) return;

    setGrid(prev => {
      const next = prev.filter(s => !(s.row_number === row && s.column_number === col));
      let newNum = '';
      if (!pal.special) {
        newNum = String(seatCounter);
        setSeatCounter(c => c + 1);
      }
      const seat = {
        ...newSeat(row, col),
        seat_class: pal.key === 'gap' ? 'window' : pal.key,
        is_driver_seat: pal.special === 'is_driver_seat',
        is_conductor_seat: pal.special === 'is_conductor_seat',
        is_aisle_gap: pal.special === 'is_aisle_gap',
        seat_number: pal.special === 'is_driver_seat' ? 'DRV'
          : pal.special === 'is_conductor_seat' ? 'COND'
          : pal.special === 'is_aisle_gap' ? ''
          : newNum,
        custom_label: '',
      };
      return [...next, seat];
    });
  };

  const eraseCell = (row, col) => {
    setGrid(prev => prev.filter(s => !(s.row_number === row && s.column_number === col)));
  };

  const handleCellClick = (row, col, e) => {
    if (activeTool === 'erase') { eraseCell(row, col); return; }
    if (e.shiftKey) { setSelected({ row, col }); return; }
    paintCell(row, col);
  };

  const updateSelected = (field, value) => {
    if (!selected) return;
    setGrid(prev => prev.map(s =>
      s.row_number === selected.row && s.column_number === selected.col
        ? { ...s, [field]: value }
        : s
    ));
  };

  const selectedSeat = selected ? getSeat(selected.row, selected.col) : null;

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await adminMatatus.saveLayout(slug, grid);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { alert('Save failed. Please try again.'); }
    finally { setSaving(false); }
  };

  const clearAll = () => {
    if (confirm('Clear entire layout? This cannot be undone.')) {
      setGrid([]);
      setSeatCounter(1);
    }
  };

  // Default 14-seater template
  const loadTemplate = (type) => {
    setGrid([]);
    setSeatCounter(1);
    let seats = [];
    let n = 1;

    if (type === '14') {
      // Row 1: Driver | gap | Front
      seats.push({ ...newSeat(1,1), is_driver_seat:true, seat_number:'DRV', seat_class:'window' });
      seats.push({ ...newSeat(1,2), is_aisle_gap:true, seat_number:'' });
      seats.push({ ...newSeat(1,3), seat_number:'F1', seat_class:'front', custom_label:'F' });
      // Rows 2-4: 2 + gap + 2
      for (let row = 2; row <= 4; row++) {
        seats.push({ ...newSeat(row,1), seat_number:String(n++), seat_class:'window' });
        seats.push({ ...newSeat(row,2), seat_number:String(n++), seat_class:'aisle' });
        seats.push({ ...newSeat(row,3), is_aisle_gap:true, seat_number:'' });
        seats.push({ ...newSeat(row,4), seat_number:String(n++), seat_class:'window' });
        seats.push({ ...newSeat(row,5), seat_number:String(n++), seat_class:'aisle' });
      }
      // Row 5: back bench (3) + conductor
      seats.push({ ...newSeat(5,1), seat_number:String(n++), seat_class:'window', col_span:2 });
      seats.push({ ...newSeat(5,3), seat_number:String(n++), seat_class:'window' });
      seats.push({ ...newSeat(5,4), seat_number:String(n++), seat_class:'window' });
      seats.push({ ...newSeat(5,5), is_conductor_seat:true, seat_number:'COND', seat_class:'conductor' });
    } else if (type === '33') {
      seats.push({ ...newSeat(1,1), is_driver_seat:true, seat_number:'DRV', seat_class:'window' });
      seats.push({ ...newSeat(1,2), is_aisle_gap:true, seat_number:'' });
      seats.push({ ...newSeat(1,3), seat_number:'F1', seat_class:'front' });
      seats.push({ ...newSeat(1,4), seat_number:'F2', seat_class:'front' });
      for (let row = 2; row <= 9; row++) {
        seats.push({ ...newSeat(row,1), seat_number:String(n++), seat_class:'window' });
        seats.push({ ...newSeat(row,2), seat_number:String(n++), seat_class:'aisle' });
        seats.push({ ...newSeat(row,3), is_aisle_gap:true, seat_number:'' });
        seats.push({ ...newSeat(row,4), seat_number:String(n++), seat_class:'window' });
        seats.push({ ...newSeat(row,5), seat_number:String(n++), seat_class:'aisle' });
      }
      // back bench
      for (let c = 1; c <= 5; c++) {
        seats.push({ ...newSeat(10,c), seat_number:String(n++), seat_class: c===1?'window':'aisle' });
      }
      seats.push({ ...newSeat(10,5), is_conductor_seat:true, seat_number:'COND', seat_class:'conductor' });
    }
    setGrid(seats);
    setSeatCounter(n);
    const maxR = Math.max(...seats.map(s => s.row_number));
    const maxC = Math.max(...seats.map(s => s.column_number));
    setRows(Math.max(maxR + 1, ROWS));
    setCols(Math.max(maxC, COLS));
  };

  const realSeats = grid.filter(s => !s.is_aisle_gap && !s.is_driver_seat && !s.is_conductor_seat);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <div className="ad-spinner ad-spinner-lg" style={{ margin: '0 auto' }}></div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-center justify-between flex-wrap gap-2 mb-4">
        <div>
          <button className="btn-ad btn-ad-ghost btn-ad-sm mb-2" onClick={() => navigate('/admin/matatus')}>
            <i className="bi bi-arrow-left"></i> Back to Matatus
          </button>
          <h4 className="fw-800" style={{ marginBottom: 2 }}>
            Seat Layout — {matatu?.name}
          </h4>
          <p className="text-muted" style={{ margin: 0 }}>
            <code>{matatu?.plate_number}</code> · {realSeats.length} bookable seats
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <button className="btn-ad btn-ad-secondary btn-ad-sm" onClick={clearAll}>
            <i className="bi bi-trash"></i> Clear All
          </button>
          <button
            className={`btn-ad btn-ad-primary ${saved ? 'btn-ad-success' : ''}`}
            onClick={handleSave} disabled={saving}
            style={saved ? { background: 'var(--success)', borderColor: 'var(--success)' } : {}}
          >
            {saving ? <><div className="ad-spinner ad-spinner-sm ad-spinner-white"></div> Saving...</>
              : saved ? <><i className="bi bi-check2-circle"></i> Saved!</>
              : <><i className="bi bi-floppy2"></i> Save Layout</>}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16, alignItems: 'start' }}>
        {/* ── Left: Grid ── */}
        <div>
          {/* Templates */}
          <div className="ad-card ad-card-pad mb-3">
            <div className="d-flex align-center gap-3 flex-wrap">
              <span style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--gray-600)' }}>Load template:</span>
              <button className="btn-ad btn-ad-secondary btn-ad-sm" onClick={() => loadTemplate('14')}>
                <i className="bi bi-layout-split"></i> 14-Seater Nissan
              </button>
              <button className="btn-ad btn-ad-secondary btn-ad-sm" onClick={() => loadTemplate('33')}>
                <i className="bi bi-layout-split"></i> 33-Seater Rosa
              </button>
              <div className="d-flex align-center gap-2 ml-auto" style={{ marginLeft: 'auto' }}>
                <span style={{ fontSize: '.78rem', color: 'var(--gray-500)' }}>Grid:</span>
                <input type="number" min={4} max={14} value={rows} onChange={e => setRows(Number(e.target.value))}
                  className="ad-input" style={{ width: 56, padding: '4px 8px', textAlign: 'center' }} />
                <span style={{ color: 'var(--gray-400)' }}>×</span>
                <input type="number" min={3} max={8} value={cols} onChange={e => setCols(Number(e.target.value))}
                  className="ad-input" style={{ width: 56, padding: '4px 8px', textAlign: 'center' }} />
              </div>
            </div>
          </div>

          {/* Painting toolbar */}
          <div className="ad-card mb-3">
            <div className="ad-card-header">
              <span className="ad-card-title">
                <i className="bi bi-palette" style={{ marginRight: 6, color: 'var(--primary)' }}></i>
                Paint Tool
              </span>
              <span className="text-muted text-sm">Click cell to place · Shift+Click to edit properties</span>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {PALETTE.map(p => (
                <button
                  key={p.key}
                  onClick={() => setActiveTool(p.key)}
                  title={p.tip}
                  style={{
                    width: 48, height: 38,
                    background: p.bg,
                    color: p.color,
                    border: `2px solid ${activeTool === p.key ? 'var(--primary)' : p.border}`,
                    borderRadius: 7,
                    fontSize: '.68rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    boxShadow: activeTool === p.key ? '0 0 0 3px rgba(37,99,235,.2)' : 'none',
                    transition: 'all .12s',
                  }}
                >
                  {p.label || ' '}
                </button>
              ))}
              {/* Eraser */}
              <button
                onClick={() => setActiveTool('erase')}
                title="Erase cell"
                style={{
                  width: 48, height: 38,
                  background: activeTool === 'erase' ? 'var(--danger-light)' : 'var(--gray-100)',
                  color: activeTool === 'erase' ? 'var(--danger)' : 'var(--gray-500)',
                  border: `2px solid ${activeTool === 'erase' ? 'var(--danger)' : 'var(--gray-300)'}`,
                  borderRadius: 7, fontSize: '1rem', cursor: 'pointer',
                  boxShadow: activeTool === 'erase' ? '0 0 0 3px rgba(220,38,38,.15)' : 'none',
                  transition: 'all .12s', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <i className="bi bi-eraser"></i>
              </button>
            </div>
          </div>

          {/* The grid */}
          <div className="ad-card ad-card-pad" style={{ overflowX: 'auto' }}>
            <div style={{ fontSize: '.75rem', color: 'var(--gray-400)', marginBottom: 10, textAlign: 'center' }}>
              ▲ FRONT OF MATATU
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, 42px)`,
              gridTemplateRows: `repeat(${rows}, 44px)`,
              gap: 6,
              width: 'fit-content',
              margin: '0 auto',
            }}>
              {Array.from({ length: rows }, (_, r) =>
                Array.from({ length: cols }, (_, c) => {
                  const row = r + 1, col = c + 1;
                  const seat = getSeat(row, col);
                  const isSelected = selected?.row === row && selected?.col === col;
                  const style = seat ? getSeatStyle(seat) : null;

                  return (
                    <div
                      key={`${row}-${col}`}
                      onClick={(e) => handleCellClick(row, col, e)}
                      style={{
                        width: 42, height: 42,
                        borderRadius: 7,
                        border: `2px solid ${isSelected ? 'var(--primary)' : seat ? style.border : 'var(--gray-200)'}`,
                        background: seat ? (seat.bg_color || style.bg) : 'var(--gray-50)',
                        color: seat ? (seat.text_color || style.color) : 'var(--gray-300)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '.65rem', fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        cursor: activeTool === 'erase' ? 'cell' : 'pointer',
                        userSelect: 'none',
                        boxShadow: isSelected ? '0 0 0 3px rgba(37,99,235,.25)' : 'none',
                        transition: 'transform .1s',
                      }}
                      onMouseEnter={e => { if (seat && !seat.is_aisle_gap) e.currentTarget.style.transform = 'scale(1.05)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                      title={seat
                        ? `${seat.is_driver_seat ? 'Driver' : seat.is_conductor_seat ? 'Conductor' : seat.is_aisle_gap ? 'Gap' : `Seat ${seat.seat_number} (${seat.seat_class})`}`
                        : `Empty [${row},${col}]`}
                    >
                      {seat ? (seat.custom_label || seat.seat_number || (seat.is_aisle_gap ? '' : '?')) : ''}
                    </div>
                  );
                })
              )}
            </div>
            <div style={{ fontSize: '.72rem', color: 'var(--gray-400)', marginTop: 10, textAlign: 'center' }}>
              {realSeats.length} bookable seats · {grid.filter(s => s.is_aisle_gap).length} gaps
            </div>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Seat Properties */}
          <div className="ad-card">
            <div className="ad-card-header">
              <span className="ad-card-title">
                <i className="bi bi-sliders" style={{ marginRight: 6 }}></i>
                Seat Properties
              </span>
            </div>
            <div style={{ padding: 14 }}>
              {!selectedSeat ? (
                <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--gray-400)', fontSize: '.82rem' }}>
                  <i className="bi bi-cursor" style={{ fontSize: '1.4rem', display: 'block', marginBottom: 8 }}></i>
                  Shift+Click a seat to edit its properties
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="ad-form-group">
                    <label className="ad-label">Seat Number</label>
                    <input className="ad-input" value={selectedSeat.seat_number}
                      onChange={e => updateSelected('seat_number', e.target.value)} />
                  </div>
                  <div className="ad-form-group">
                    <label className="ad-label">Custom Label</label>
                    <input className="ad-input" placeholder="Leave blank to use seat number"
                      value={selectedSeat.custom_label}
                      onChange={e => updateSelected('custom_label', e.target.value)} />
                  </div>
                  <div className="ad-form-group">
                    <label className="ad-label">Class</label>
                    <select className="ad-select" value={selectedSeat.seat_class}
                      onChange={e => updateSelected('seat_class', e.target.value)}>
                      <option value="window">Window</option>
                      <option value="aisle">Aisle</option>
                      <option value="front">Front</option>
                      <option value="conductor">Conductor</option>
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div className="ad-form-group">
                      <label className="ad-label">BG Color</label>
                      <input type="color" className="ad-input" style={{ padding: 3, height: 36, cursor: 'pointer' }}
                        value={selectedSeat.bg_color || '#dcfce7'}
                        onChange={e => updateSelected('bg_color', e.target.value)} />
                    </div>
                    <div className="ad-form-group">
                      <label className="ad-label">Text Color</label>
                      <input type="color" className="ad-input" style={{ padding: 3, height: 36, cursor: 'pointer' }}
                        value={selectedSeat.text_color || '#15803d'}
                        onChange={e => updateSelected('text_color', e.target.value)} />
                    </div>
                  </div>
                  <div className="ad-form-group">
                    <label className="ad-label">Col Span</label>
                    <input className="ad-input" type="number" min={1} max={4}
                      value={selectedSeat.col_span}
                      onChange={e => updateSelected('col_span', Number(e.target.value))} />
                  </div>
                  <button className="btn-ad btn-ad-secondary btn-ad-sm" onClick={() => setSelected(null)}>
                    <i className="bi bi-x"></i> Deselect
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="ad-card ad-card-pad">
            <div className="ad-section-title mb-2">Legend</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {PALETTE.filter(p => p.key !== 'gap').map(p => (
                <div key={p.key} className="d-flex align-center gap-2">
                  <div style={{ width: 20, height: 16, background: p.bg, border: `1.5px solid ${p.border}`, borderRadius: 3, flexShrink: 0 }}></div>
                  <span style={{ fontSize: '.78rem', color: 'var(--gray-600)' }}>{p.tip}</span>
                </div>
              ))}
              <div className="d-flex align-center gap-2">
                <div style={{ width: 20, height: 16, background: 'var(--gray-50)', border: '1.5px dashed var(--gray-300)', borderRadius: 3 }}></div>
                <span style={{ fontSize: '.78rem', color: 'var(--gray-600)' }}>Aisle Gap</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="ad-card ad-card-pad">
            <div className="ad-section-title mb-2">Layout Stats</div>
            {[
              ['Bookable Seats', realSeats.length],
              ['Driver Seat', grid.filter(s => s.is_driver_seat).length],
              ['Conductor', grid.filter(s => s.is_conductor_seat).length],
              ['Aisle Gaps', grid.filter(s => s.is_aisle_gap).length],
              ['Grid Size', `${rows} × ${cols}`],
            ].map(([l, v]) => (
              <div key={l} className="d-flex justify-between" style={{ padding: '5px 0', borderBottom: '1px solid var(--gray-100)', fontSize: '.82rem' }}>
                <span style={{ color: 'var(--gray-500)' }}>{l}</span>
                <span style={{ fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}