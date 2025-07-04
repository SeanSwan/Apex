/**
 * AdvancedTab Component - Extracted from ThemeBuilder
 * Handles advanced customization like custom CSS
 */

import React from 'react';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { ExtendedThemeSettings } from '../../utils';
import {
  CollapsibleSection,
  CollapsibleHeader,
  CollapsibleContent,
  Label,
  TextArea,
  ActionBar,
  ActionButton
} from '../../shared';

interface AdvancedTabProps {
  settings: ExtendedThemeSettings;
  onChange: (settings: Partial<ExtendedThemeSettings>) => void;
  expandedSections: { [key: string]: boolean };
  onToggleSection: (section: string) => void;
}

const AdvancedTab: React.FC<AdvancedTabProps> = ({ 
  settings, 
  onChange, 
  expandedSections, 
  onToggleSection 
}) => {
  return (
    <div>
      <CollapsibleSection $expanded={expandedSections.custom}>
        <CollapsibleHeader onClick={() => onToggleSection('custom')}>
          <h4>Custom CSS</h4>
          {expandedSections.custom ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </CollapsibleHeader>
        <CollapsibleContent $expanded={expandedSections.custom}>
          <Label>Custom CSS (Advanced Users)</Label>
          <TextArea
            placeholder="/* Add your custom CSS here */&#10;.theme-container {&#10;  /* Your styles */&#10;}"
            value={settings.customCSS || ''}
            onChange={(e) => onChange({ customCSS: e.target.value })}
          />
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: 'rgba(255, 215, 0, 0.1)', 
            borderRadius: '8px', 
            fontSize: '0.85rem', 
            color: '#ccc' 
          }}>
            <strong style={{ color: '#FFD700' }}>Pro Tip:</strong> Use CSS variables for consistent theming:
            <br />• <code>--primary-color</code> • <code>--secondary-color</code> • <code>--accent-color</code>
          </div>
        </CollapsibleContent>
      </CollapsibleSection>

      <ActionBar>
        <ActionButton 
          onClick={() => onChange({ customCSS: '' })} 
          $variant="secondary"
        >
          <RotateCcw size={18} />
          Clear Custom CSS
        </ActionButton>
      </ActionBar>
    </div>
  );
};

export default AdvancedTab;
