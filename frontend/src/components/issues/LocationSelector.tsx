import { useState } from 'react';
import { nigeriaLocationData, getStateById, getLGAById, type State, type LGA, type Ward } from '../../data/locationData';
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
  const [selectedWard, setSelectedWard] = useState<Ward | undefined>(
    value && selectedLGA ? getLGAById(value.state, value.lga)?.wards.find((w) => w.id === value.ward) : undefined
  );

  const handleStateChange = (stateId: string) => {
    const state = getStateById(stateId);
    setSelectedState(state);
    setSelectedLGA(undefined);
    setSelectedWard(undefined);

    if (state) {
      onChange(undefined);
    }
  };

  const handleLGAChange = (lgaId: string) => {
    if (!selectedState) return;
    const lga = getLGAById(selectedState.id, lgaId);
    setSelectedLGA(lga);
    setSelectedWard(undefined);

    if (lga) {
      onChange(undefined);
    }
  };

  const handleWardChange = (wardId: string) => {
    if (!selectedState || !selectedLGA) return;
    const ward = selectedLGA.wards.find((w) => w.id === wardId);
    setSelectedWard(ward);

    if (ward) {
      onChange({
        state: selectedState.id,
        lga: selectedLGA.id,
        ward: ward.id,
      });
    }
  };

  return (
    <div className="space-y-3">
      <div className="mb-2 flex items-center gap-2 text-[var(--civic-text)]">
        <Icon name="location_on" className="text-lg text-[var(--civic-primary)]" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--civic-muted)]">
          Location {required && <span className="text-red-500">*</span>}
        </span>
      </div>

      {/* State Selector */}
      <div className="relative">
        <select
          value={selectedState?.id || ''}
          onChange={(e) => handleStateChange(e.target.value)}
          className="w-full appearance-none rounded-md px-3 py-3 text-sm text-[var(--civic-text)] transition focus:outline-none cursor-pointer"
          style={{ background: 'var(--civic-surface-strong)', boxShadow: 'inset 0 0 0 1px var(--civic-ghost-border)' }}
          required={required}
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

      {/* LGA Selector */}
      {selectedState && (
        <div className="relative">
          <select
            value={selectedLGA?.id || ''}
            onChange={(e) => handleLGAChange(e.target.value)}
            className="w-full appearance-none rounded-md px-3 py-3 text-sm text-[var(--civic-text)] transition focus:outline-none cursor-pointer"
            style={{ background: 'var(--civic-surface-strong)', boxShadow: 'inset 0 0 0 1px var(--civic-ghost-border)' }}
            required={required}
          >
            <option value="">Select LGA</option>
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

      {/* Ward Selector */}
      {selectedLGA && (
        <div className="relative">
          <select
            value={selectedWard?.id || ''}
            onChange={(e) => handleWardChange(e.target.value)}
            className="w-full appearance-none rounded-md px-3 py-3 text-sm text-[var(--civic-text)] transition focus:outline-none cursor-pointer"
            style={{ background: 'var(--civic-surface-strong)', boxShadow: 'inset 0 0 0 1px var(--civic-ghost-border)' }}
            required={required}
          >
            <option value="">Select ward</option>
            {selectedLGA.wards.map((ward) => (
              <option key={ward.id} value={ward.id}>
                {ward.name}
              </option>
            ))}
          </select>
          <Icon
            name="expand_more"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--civic-muted)]"
          />
        </div>
      )}

      {selectedState && selectedLGA && selectedWard && (
        <div
          className="flex items-center gap-2 rounded-md px-3 py-2"
          style={{ background: 'var(--civic-primary-glow)', boxShadow: 'inset 0 0 0 1px rgba(10,106,59,0.16)' }}
        >
          <Icon name="check_circle" className="text-sm text-[var(--civic-primary)]" />
          <span className="text-xs text-[var(--civic-text)]">
            {selectedWard.name}, {selectedLGA.name}, {selectedState.name}
          </span>
        </div>
      )}
    </div>
  );
}
