import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Measurement {
  width: string;
  height: string;
  depth?: string;
  notes?: string;
}

export default function MeasurementGuide() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [currentMeasurement, setCurrentMeasurement] = useState<Measurement>({
    width: '',
    height: '',
    depth: '',
    notes: ''
  });

  const handleInputChange = (field: keyof Measurement, value: string) => {
    setCurrentMeasurement(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveMeasurement = () => {
    if (currentMeasurement.width && currentMeasurement.height) {
      setMeasurements(prev => [...prev, currentMeasurement]);
      setCurrentMeasurement({
        width: '',
        height: '',
        depth: '',
        notes: ''
      });
    }
  };

  return (
    <div className="space-y-6 p-4 border rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold">Measurement Guide</h2>

      <Accordion type="single" collapsible>
        <AccordionItem value="video-guide">
          <AccordionTrigger>Watch Video Guide</AccordionTrigger>
          <AccordionContent>
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              Video player placeholder
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="step-by-step">
          <AccordionTrigger>Step-by-Step Instructions</AccordionTrigger>
          <AccordionContent>
            <ol className="list-decimal list-inside space-y-2">
              <li>Measure the width of your window at three points: top, middle, and bottom</li>
              <li>Measure the height at three points: left, center, and right</li>
              <li>For inside mount, measure the depth of your window frame</li>
              <li>Use the smallest measurements for inside mount</li>
              <li>Add 4 inches to width and height for outside mount</li>
            </ol>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="space-y-4 mt-6">
        <h3 className="text-lg font-semibold">Record Measurements</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Width (inches)</label>
            <Input
              type="number"
              step="0.125"
              value={currentMeasurement.width}
              onChange={(e) => handleInputChange('width', e.target.value)}
              placeholder="Enter width"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Height (inches)</label>
            <Input
              type="number"
              step="0.125"
              value={currentMeasurement.height}
              onChange={(e) => handleInputChange('height', e.target.value)}
              placeholder="Enter height"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Depth (inches, optional)</label>
          <Input
            type="number"
            step="0.125"
            value={currentMeasurement.depth}
            onChange={(e) => handleInputChange('depth', e.target.value)}
            placeholder="Enter depth"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <Input
            value={currentMeasurement.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Add any additional notes"
          />
        </div>

        <Button
          onClick={saveMeasurement}
          disabled={!currentMeasurement.width || !currentMeasurement.height}
          className="w-full"
        >
          Save Measurement
        </Button>
      </div>

      {measurements.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Saved Measurements</h3>
          <div className="space-y-2">
            {measurements.map((m, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Window {index + 1}</span>
                  <span className="text-sm text-gray-500">
                    {m.width}" × {m.height}"
                    {m.depth && ` × ${m.depth}"`}
                  </span>
                </div>
                {m.notes && (
                  <p className="text-sm text-gray-600 mt-1">{m.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 