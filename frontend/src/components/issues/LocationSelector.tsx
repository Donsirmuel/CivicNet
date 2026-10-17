import { useState } from 'react';
import { nigeriaLocationData, getStateById, getLGAById, type State, type LGA } from '../../data/locationData';
import { Icon } from '../common';

interface LocationSelectorProps {
  value?: {
    state: string;
    lga: string;
    ward: string;
  };
  onChange: (location: { state: string; lga: string; ward: string } | undefined) => void;
  required?: boolean;
}

export default function LocationSelector({ value, onChange, required = false }: LocationSelectorProps) {
  const [selectedState, setSelectedState] = useState<State | undefined>(
    value ? getStateById(value.state) : undefined
  );
  const [selectedLGA, setSelectedLGA] = useState<LGA | undefined>(
    value && selectedState ? getLGAById(value.state, value.lga) : undefined
  );
  const [wardText, setWardText] = useState<string>(value?.ward ?? '');

  const handleStateChange = (stateId: string) => {
    const state = getStateById(stateId);
    setSelectedState(state);
    setSelectedLGA(undefined);
    setWardText('');
    onChange(undefined);
  };

  const handleLGAChange = (lgaId: string) => {
    if (!selectedState) return;
    const lga = getLGAById(selectedState.id, lgaId);
    setSelectedLGA(lga);
    setWardText('');
    if (lga) {
      onChange({ state: selectedState.name, lga: lga.name, ward: '' });
    }
  };

  const handleWardChange = (text: string) => {
    if (!selectedState || !selectedLGA) return;
    setWardText(text);
    onChange({ state: selectedState.name, lga: selectedLGA.name, ward: text });
  };

  const selectClass =
    'w-full appearance-none rounded-md px-3 py-3 text-sm text-[var(--civic-text)] transition focus:outline-none cursor-pointer';
  const selectStyle = {
    background: 'var(--civic-surface-strong)',
    boxShadow: 'inset 0 0 0 1px var(--civic-ghost-border)',
  } as const;

  return (
    <div className="space-y-3">
      <div className="mb-2 flex items-center gap-2 text-[var(--civic-text)]">
        <Icon name="location_on" className="text-lg text-[var(--civic-primary)]" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--civic-muted)]">
          Location {required && <span className="text-red-500">*</span>}
        </span>
      </div>

      {/* State */}
      <div className="relative">
        <select
          value={selectedState?.id || ''}
          onChange={(e) => handleStateChange(e.target.value)}
          className={selectClass}
          style={selectStyle}
          required={required}
          aria-label="State"
        >
          <option value="">Select state</option>
          {nigeriaLocationData.map((state) => (
            <option key={state.id} value={state.id}>
              {state.name}
            </option>
          ))}
        </select>
        <Icon
          name="expand_more"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--civic-muted)]"
        />
      </div>

      {/* LGA */}
      {selectedState && (
        <div className="relative">
          <select
            value={selectedLGA?.id || ''}
            onChange={(e) => handleLGAChange(e.target.value)}
            className={selectClass}
            style={selectStyle}
            required={required}
            aria-label="Local government area"
          >
            <option value="">Select local government area</option>
            {selectedState.lgas.map((lga) => (
              <option key={lga.id} value={lga.id}>
                {lga.name}
              </option>
            ))}
          </select>
          <Icon
            name="expand_more"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--civic-muted)]"
          />
        </div>
      )}

      {/* Ward — typed by the person reporting; optional */}
      {selectedLGA && (
        <div>
          <input
            type="text"
            value={wardText}
            onChange={(e) => handleWardChange(e.target.value)}
            placeholder="Type your ward (optional) — e.g. Ward 4, Opebi"
            className="w-full rounded-md px-3 py-3 text-sm text-[var(--civic-text)] placeholder:text-[var(--civic-muted)] transition focus:outline-none"
            style={selectStyle}
            aria-label="Ward"
          />
          <p className="mt-1.5 text-[11px] text-[var(--civic-muted)]">
            Type your ward or area if you know it — it helps route the report to the right office.
          </p>
        </div>
      )}

      {selectedState && selectedLGA && (
        <div
          className="flex items-center gap-2 rounded-md px-3 py-2"
          style={{ background: 'var(--civic-primary-glow)', boxShadow: 'inset 0 0 0 1px rgba(10,106,59,0.16)' }}
        >
          <Icon name="check_circle" className="text-sm text-[var(--civic-primary)]" />
          <span className="text-xs text-[var(--civic-text)]">
            {[wardText.trim(), selectedLGA.name, selectedState.name].filter(Boolean).join(', ')}
          </span>
        </div>
      )}
    </div>
  );
}
