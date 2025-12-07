import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as d3 from 'd3';
import * as topola from 'topola';
import type { GedcomData } from '@/types/gedcom';
import type { ChartType } from '@/types/chart';
import { TopolaDataAdapter } from '@/services/topolaDataAdapter';
import { useGedcomStore } from '@/store/gedcomStore';
import './topola.css';

// Extract chart types from topola
const {
  createChart,
  HourglassChart,
  AncestorChart,
  DescendantChart,
  RelativesChart,
  DetailedRenderer,
  SimpleRenderer,
} = topola as any;

interface TopolaChartProps {
  gedcomData: GedcomData;
  selectedProfileId: string;
  chartType: ChartType;
  zoom?: number;
}

export interface TopolaChartHandle {
  centerOnSelectedProfile: () => void;
}

const TopolaChart = forwardRef<TopolaChartHandle, TopolaChartProps>(({ gedcomData, selectedProfileId, chartType, zoom = 1 }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const chartHandleRef = useRef<any>(null);
  const chartIdRef = useRef(`topola-chart-${Math.random().toString(36).substr(2, 9)}`);
  const selectProfile = useGedcomStore((state) => state.selectProfile);
  const isPanningRef = useRef(false);
  const zoomLevelRef = useRef(1);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    centerOnSelectedProfile,
  }));

  // Enable zoom with scroll wheel
  useEffect(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    if (!container || !svg) return;

    const handleWheel = (e: WheelEvent) => {
      // Only zoom when not pressing Shift (shift+wheel = horizontal scroll)
      if (e.shiftKey) return;
      
      e.preventDefault();
      
      const delta = e.deltaY;
      const zoomFactor = delta > 0 ? 0.9 : 1.1; // Zoom out or in
      const newZoom = Math.max(0.1, Math.min(5, zoomLevelRef.current * zoomFactor));
      
      zoomLevelRef.current = newZoom;
      
      // Get mouse position relative to container
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left + container.scrollLeft;
      const mouseY = e.clientY - rect.top + container.scrollTop;
      
      // Apply zoom transform
      d3.select(svg).select('g').attr('transform', `scale(${newZoom})`);
      
      // Adjust scroll position to zoom towards mouse cursor
      const newMouseX = mouseX * zoomFactor;
      const newMouseY = mouseY * zoomFactor;
      container.scrollLeft += (newMouseX - mouseX);
      container.scrollTop += (newMouseY - mouseY);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Enable pan/drag functionality
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isPanning = false;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;

    const handleMouseDown = (e: MouseEvent) => {
      // Only drag on left button and not on interactive elements
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'text' || target.tagName === 'a') return;
      
      isPanning = true;
      isPanningRef.current = true;
      startX = e.clientX;
      startY = e.clientY;
      scrollLeft = container.scrollLeft;
      scrollTop = container.scrollTop;
      container.style.cursor = 'grabbing';
      container.style.userSelect = 'none';
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning) return;
      e.preventDefault();
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      container.scrollLeft = scrollLeft - dx;
      container.scrollTop = scrollTop - dy;
    };

    const handleMouseUp = () => {
      if (isPanning) {
        isPanning = false;
        setTimeout(() => {
          isPanningRef.current = false;
        }, 100);
        container.style.cursor = 'grab';
        container.style.userSelect = '';
      }
    };

    const handleMouseLeave = () => {
      if (isPanning) {
        handleMouseUp();
      }
    };

    container.style.cursor = 'grab';
    container.style.overflow = 'auto';
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current || !gedcomData || !selectedProfileId) {
      return;
    }

    console.log('TopolaChart re-rendering for profile:', selectedProfileId, 'chartType:', chartType);

    // Add unique ID to SVG for selector
    svgRef.current.id = chartIdRef.current;

    try {
      // Convert data to Topola format
      const adapter = new TopolaDataAdapter();
      const topolaData = adapter.convertToTopolaFormat(gedcomData);
      
      // Debug: Check a few sample individuals
      const sampleIndis = topolaData.indis.slice(0, 3);
      console.log('Sample Topola data individuals:', JSON.stringify(sampleIndis, null, 2).substring(0, 500));

      // Clear previous chart
      d3.select(svgRef.current).selectAll('*').remove();

      // Select chart type class
      let ChartClass;
      switch (chartType) {
        case 'hourglass':
          ChartClass = HourglassChart;
          break;
        case 'ancestors':
          ChartClass = AncestorChart;
          break;
        case 'descendants':
          ChartClass = DescendantChart;
          break;
        case 'relatives':
          ChartClass = RelativesChart;
          break;
        default:
          ChartClass = HourglassChart;
      }

      // Create chart with Topola's simple API
      const chartHandle = createChart({
        json: topolaData,
        chartType: ChartClass,
        renderer: DetailedRenderer,
        svgSelector: `#${chartIdRef.current}`,
        indiCallback: (info: any) => {
          // Navigate to clicked individual (but not during panning)
          if (info && info.id && !isPanningRef.current) {
            selectProfile(info.id);
          }
        },
        animate: true,
        updateSvgSize: false, // Let us handle sizing
      });

      chartHandleRef.current = chartHandle;

      // Render the chart
      chartHandle.render({
        startIndi: selectedProfileId,
      });

      // Debug: Check what text elements were rendered
      setTimeout(() => {
        if (svgRef.current) {
          const allText = d3.select(svgRef.current).selectAll('text').nodes() as SVGTextElement[];
          const sampleText = allText.slice(0, 10).map((t: SVGTextElement) => ({
            content: t.textContent,
            class: t.getAttribute('class'),
            x: t.getAttribute('x'),
            y: t.getAttribute('y'),
          }));
          console.log('Sample text elements in chart:', sampleText);
          
          // Also log what the chart handle has access to
          console.log('Chart data sample:', topolaData.indis[0]);
        }
      }, 50);

      // Reset zoom level when chart changes
      zoomLevelRef.current = 1;
      d3.select(svgRef.current).select('g').attr('transform', 'scale(1)');

      // Fix SVG sizing after render
      setTimeout(() => {
        if (svgRef.current && containerRef.current) {
          const svg = svgRef.current;
          const container = containerRef.current;
          
          try {
            const bbox = svg.getBBox();
            
            // Add padding around the content
            const padding = 100;
            
            // Calculate the actual content dimensions
            const contentWidth = bbox.width + padding * 2;
            const contentHeight = bbox.height + padding * 2;
            
            // Set SVG size to be large enough to contain all content
            const svgWidth = Math.max(contentWidth, container.clientWidth || 800);
            const svgHeight = Math.max(contentHeight, container.clientHeight || 600);
            
            svg.setAttribute('width', svgWidth.toString());
            svg.setAttribute('height', svgHeight.toString());
            
            // Create a viewBox that encompasses all content with padding
            // Starting from bbox min coordinates minus padding
            const viewBoxX = bbox.x - padding;
            const viewBoxY = bbox.y - padding;
            const viewBoxWidth = bbox.width + padding * 2;
            const viewBoxHeight = bbox.height + padding * 2;
            
            svg.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`);
            
            console.log('SVG sized:', { 
              svgWidth, 
              svgHeight, 
              viewBox: `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`,
              bbox 
            });
          } catch (error) {
            console.error('Error sizing SVG:', error);
          }
        }
        centerOnSelectedProfile();
      }, 100);
      
    } catch (error) {
      console.error('Error rendering Topola chart:', error);
      
      // Fallback rendering
      renderFallbackChart(svgRef.current!, selectedProfileId, chartType);
    }

    return () => {
      // Cleanup
      if (chartHandleRef.current) {
        chartHandleRef.current = null;
      }
    };
  }, [gedcomData, selectedProfileId, chartType]);

  // Function to center the viewport on the selected profile
  const centerOnSelectedProfile = () => {
    if (!containerRef.current || !svgRef.current) return;

    console.log('Attempting to center on profile:', selectedProfileId);

    try {
      const svg = d3.select(svgRef.current);
      
      // Debug: Log some sample elements to understand the structure
      const sampleGroups = svg.selectAll('g').nodes().slice(0, 10) as SVGElement[];
      console.log('Sample SVG groups:', sampleGroups.map(el => {
        const attrs: any = {};
        for (let i = 0; i < el.attributes.length; i++) {
          const attr = el.attributes[i];
          attrs[attr.name] = attr.value;
        }
        return {
          tagName: el.tagName,
          attributes: attrs,
          childrenCount: el.children.length,
          textContent: el.textContent?.substring(0, 50)
        };
      }));
      
      // Also check for rectangles and other elements
      const sampleRects = svg.selectAll('rect').nodes().slice(0, 10) as SVGElement[];
      console.log('Sample SVG rects:', sampleRects.map(el => {
        const attrs: any = {};
        for (let i = 0; i < el.attributes.length; i++) {
          const attr = el.attributes[i];
          attrs[attr.name] = attr.value;
        }
        return attrs;
      }));
      
      // Try multiple selectors to find the profile element
      const cleanId = selectedProfileId.replace(/@/g, '');
      
      let profileElement: SVGElement | null = null;
      
      // Try various selectors that Topola might use
      const selectors = [
        `[data-id="${selectedProfileId}"]`,
        `[data-id="${cleanId}"]`,
        `#${cleanId}`,
        `g[id="${cleanId}"]`,
        `g[id*="${cleanId}"]`,
        `rect[data-id="${selectedProfileId}"]`,
        `rect[data-id="${cleanId}"]`,
        `.indi[data-indi="${selectedProfileId}"]`,
        `.indi[data-indi="${cleanId}"]`,
        `[data-individual-id="${selectedProfileId}"]`,
        `[data-individual-id="${cleanId}"]`,
      ];
      
      for (const selector of selectors) {
        try {
          const element = svg.select(selector).node() as SVGElement;
          if (element) {
            console.log('Found profile with selector:', selector);
            profileElement = element;
            break;
          }
        } catch (e) {
          // Selector might be invalid, continue
        }
      }
      
      // If still not found, search through all g elements for text content match
      if (!profileElement) {
        const allGroups = svg.selectAll('g').nodes() as SVGElement[];
        console.log(`Searching through ${allGroups.length} group elements...`);
        
        // Find a group element that:
        // 1. Contains the profile ID in its text content
        // 2. Has a reasonable number of children (person boxes typically have 3-15 children)
        // 3. Contains rect elements (person boxes have rectangles)
        profileElement = allGroups.find(el => {
          const textContent = el.textContent || '';
          const hasProfileId = textContent.includes(selectedProfileId) || textContent.includes(cleanId);
          
          if (hasProfileId) {
            // Check if this is a person box (has rect children and reasonable structure)
            const hasRect = Array.from(el.children).some(child => child.tagName === 'rect');
            const childCount = el.children.length;
            const isPersonBox = hasRect && childCount >= 3 && childCount <= 20;
            
            if (isPersonBox) {
              return true;
            }
          }
          return false;
        }) || null;
        
        if (profileElement) {
          console.log('Found profile by searching groups, tag:', profileElement.tagName, 'children:', profileElement.children.length);
        }
      }
      
      if (profileElement) {
        console.log('Centering on found profile element');
        scrollToElement(profileElement);
      } else {
        console.log('Profile element not found, centering on content. ID searched:', selectedProfileId, cleanId);
        scrollToCenter();
      }
    } catch (error) {
      console.log('Error finding profile, using default centering:', error);
      scrollToCenter();
    }
  };

  const scrollToElement = (element: SVGElement) => {
    if (!containerRef.current || !svgRef.current) return;
    
    try {
      // Make sure element has getBBox method (some SVG elements don't)
      if (typeof (element as any).getBBox !== 'function') {
        console.log('Element does not have getBBox, trying to find parent with bbox');
        // Try to find a parent or child that has getBBox
        let bboxElement = element.parentElement as SVGElement;
        while (bboxElement && typeof (bboxElement as any).getBBox !== 'function') {
          bboxElement = bboxElement.parentElement as SVGElement;
        }
        if (!bboxElement) {
          console.log('Could not find element with bbox, centering on content');
          scrollToCenter();
          return;
        }
        element = bboxElement;
      }
      
      const bbox = (element as any).getBBox();
      const container = containerRef.current;
      const svg = svgRef.current;
      const currentZoom = zoomLevelRef.current;
      
      // Get viewBox to understand coordinate system offset
      const viewBoxAttr = svg.getAttribute('viewBox');
      let viewBoxX = 0, viewBoxY = 0;
      if (viewBoxAttr) {
        const viewBoxParts = viewBoxAttr.split(' ').map(Number);
        viewBoxX = viewBoxParts[0] || 0;
        viewBoxY = viewBoxParts[1] || 0;
      }
      
      // Calculate the element's center in SVG coordinates
      const elementCenterX = bbox.x + bbox.width / 2;
      const elementCenterY = bbox.y + bbox.height / 2;
      
      // Convert to screen coordinates accounting for viewBox offset
      // The element's position relative to viewBox origin
      const relativeX = (elementCenterX - viewBoxX) * currentZoom;
      const relativeY = (elementCenterY - viewBoxY) * currentZoom;
      
      // Calculate scroll position to center this point in the viewport
      const scrollX = relativeX - container.clientWidth / 2;
      const scrollY = relativeY - container.clientHeight / 2;
      
      console.log('Scrolling to element:', { 
        elementCenterX, 
        elementCenterY, 
        viewBoxX, 
        viewBoxY,
        relativeX,
        relativeY,
        scrollX, 
        scrollY,
        currentZoom 
      });
      
      container.scrollTo({
        left: Math.max(0, scrollX),
        top: Math.max(0, scrollY),
        behavior: 'smooth'
      });
    } catch (error) {
      console.error('Error scrolling to element:', error);
      scrollToCenter();
    }
  };

  const scrollToCenter = () => {
    if (!containerRef.current || !svgRef.current) return;
    
    const container = containerRef.current;
    const svg = svgRef.current;
    
    try {
      // Get the SVG dimensions
      const svgWidth = svg.clientWidth || parseInt(svg.getAttribute('width') || '0');
      const svgHeight = svg.clientHeight || parseInt(svg.getAttribute('height') || '0');
      
      const currentZoom = zoomLevelRef.current;
      
      // Calculate scroll position to center the SVG content in the viewport
      // The SVG content is already sized to fit, so we center based on the SVG dimensions
      const scrollX = (svgWidth * currentZoom - container.clientWidth) / 2;
      const scrollY = (svgHeight * currentZoom - container.clientHeight) / 2;
      
      container.scrollTo({
        left: Math.max(0, scrollX),
        top: Math.max(0, scrollY),
        behavior: 'smooth'
      });
      
      console.log('Centering chart:', { svgWidth, svgHeight, scrollX, scrollY, currentZoom });
    } catch (error) {
      console.log('Could not center content:', error);
    }
  };

  // Apply zoom (from zoom controls)
  useEffect(() => {
    if (!svgRef.current) return;
    
    zoomLevelRef.current = zoom;
    const svg = d3.select(svgRef.current);
    svg.select('g').attr('transform', `scale(${zoom})`);
  }, [zoom]);

  return (
    <div ref={containerRef} className="w-full h-full overflow-auto bg-gray-50" style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        style={{ display: 'block' }}
      />
    </div>
  );
});

TopolaChart.displayName = 'TopolaChart';

// Fallback chart rendering with D3
function renderFallbackChart(svg: SVGSVGElement, selectedProfileId: string, chartType: ChartType) {
  const s = d3.select(svg);
  s.selectAll('*').remove();

  const width = 800;
  const height = 600;
  
  s.attr('viewBox', `0 0 ${width} ${height}`);

  const g = s.append('g')
    .attr('transform', `translate(${width / 2}, ${height / 2})`);

  // Draw a simple placeholder
  g.append('circle')
    .attr('r', 60)
    .attr('fill', '#4a90e2')
    .attr('stroke', '#2c5aa0')
    .attr('stroke-width', 3);

  g.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '-0.5em')
    .attr('fill', 'white')
    .attr('font-size', '16')
    .attr('font-weight', 'bold')
    .text('Chart View');

  g.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '1em')
    .attr('fill', 'white')
    .attr('font-size', '12')
    .text(chartType.toUpperCase());

  g.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '2.5em')
    .attr('fill', 'white')
    .attr('font-size', '10')
    .text(`ID: ${selectedProfileId}`);

  // Add note
  s.append('text')
    .attr('x', width / 2)
    .attr('y', height - 30)
    .attr('text-anchor', 'middle')
    .attr('fill', '#666')
    .attr('font-size', '14')
    .text('Topola integration in progress - showing fallback visualization');
}

export default TopolaChart;
