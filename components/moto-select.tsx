'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MOTO_BRANDS, MOTO_MODELS } from '@/lib/moto-data';

interface MotoSelectProps {
  motorcycle: string;
  model: string;
  onMotorcycleChange: (value: string) => void;
  onModelChange: (value: string) => void;
}

export function MotoSelect({ motorcycle, model, onMotorcycleChange, onModelChange }: MotoSelectProps) {
  const isKnownBrand = MOTO_BRANDS.includes(motorcycle as any) && motorcycle !== 'Outra';
  const isOutra = motorcycle === 'Outra';
  // Legacy free-text value that doesn't match any known brand
  const isFreeText = !isKnownBrand && !isOutra && motorcycle !== '';

  const brandSelectValue = isKnownBrand ? motorcycle : (isOutra || isFreeText) ? 'Outra' : '';
  const models = isKnownBrand ? (MOTO_MODELS[motorcycle] ?? []) : [];
  const isModelInList = models.includes(model);

  // Track whether user chose "Outro modelo" from the dropdown
  const [customModel, setCustomModel] = useState(false);

  // Reset customModel when brand changes
  useEffect(() => {
    setCustomModel(false);
  }, [motorcycle]);

  // If editing and model isn't in list for a known brand, show free text
  const showModelFreeText = isKnownBrand && models.length > 0 && !isModelInList && model !== '' && !customModel;

  const handleBrandChange = (value: string) => {
    onMotorcycleChange(value);
    onModelChange('');
    setCustomModel(false);
  };

  const handleModelSelect = (value: string) => {
    if (value === '__outro__') {
      setCustomModel(true);
      onModelChange('');
    } else {
      setCustomModel(false);
      onModelChange(value);
    }
  };

  // Show free text for brand when "Outra" or legacy free-text
  const showBrandFreeText = isOutra || isFreeText;
  // Show model dropdown only for known brands with models
  const showModelDropdown = isKnownBrand && models.length > 0 && !customModel && !showModelFreeText;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label>Marca</Label>
        <Select value={brandSelectValue} onValueChange={handleBrandChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a marca" />
          </SelectTrigger>
          <SelectContent position="popper" side="bottom" sideOffset={4} className="max-h-[200px] overflow-y-auto z-[9999]">
            {MOTO_BRANDS.map((brand) => (
              <SelectItem key={brand} value={brand}>{brand}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {showBrandFreeText && (
          <Input
            value={motorcycle === 'Outra' ? '' : motorcycle}
            onChange={(e) => onMotorcycleChange(e.target.value || 'Outra')}
            placeholder="Digite a marca..."
          />
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Modelo</Label>
        {showModelDropdown ? (
          <Select value={isModelInList ? model : ''} onValueChange={handleModelSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o modelo" />
            </SelectTrigger>
            <SelectContent position="popper" side="bottom" sideOffset={4} className="max-h-[200px] overflow-y-auto z-[9999]">
              {models.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
              <SelectItem value="__outro__">Outro modelo</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            placeholder="Digite o modelo..."
          />
        )}
        {/* If known brand but model not in list (editing legacy data), show input below */}
        {showModelFreeText && (
          <Input
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            placeholder="Digite o modelo..."
          />
        )}
      </div>
    </div>
  );
}
