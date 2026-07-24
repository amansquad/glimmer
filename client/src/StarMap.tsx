import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Graph, GraphNode } from "./types";
import { colorForTag, DEFAULT_STAR_COLOR } from "./colors";

interface Props {
  graph: Graph;
  selectedId: string | null;
  searchQuery: string;
  onSelect: (node: GraphNode) => void;
}

type SimNode = GraphNode & d3.SimulationNodeDatum;

function matchesSearch(node: GraphNode, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return node.title.toLowerCase().includes(q) || node.tags.some((t) => t.includes(q));
}

export function StarMap({ graph, selectedId, searchQuery, onSelect }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current?.clientWidth || 800;
    const height = svgRef.current?.clientHeight || 600;

    const nodes: SimNode[] = graph.nodes.map((n) => ({ ...n }));
    const links = graph.edges.map((e) => ({ source: e.source, target: e.target }));

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(120)
          .strength(0.4)
      )
      .force("charge", d3.forceManyBody().strength(-220))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(28));

    const constellation = svg
      .append("g")
      .attr("stroke", "#5b6b9c")
      .attr("stroke-opacity", 0.35)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1);

    const starGroup = svg
      .append("g")
      .selectAll<SVGGElement, SimNode>("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer");

    starGroup.each(function (d) {
      const g = d3.select(this);
      const matched = matchesSearch(d, searchQuery);
      const dimFactor = matched ? 1 : 0.12;
      const color = d.tags[0] ? colorForTag(d.tags[0]) : DEFAULT_STAR_COLOR;

      g.append("circle")
        .attr("r", (d.ghost ? 8 : 6 + d.brightness * 10))
        .attr("fill", d.ghost ? "none" : color)
        .attr("stroke", d.ghost ? "#7a86b8" : d.id === selectedId ? "#7dd3fc" : "none")
        .attr("stroke-width", d.ghost ? 1.5 : 2)
        .attr("stroke-dasharray", d.ghost ? "3,3" : null)
        .attr("opacity", (d.ghost ? 0.5 : 0.15 + d.brightness * 0.85) * dimFactor);

      if (!d.ghost) {
        g.append("circle")
          .attr("r", 14 + d.brightness * 18)
          .attr("fill", color)
          .attr("opacity", d.brightness * 0.12 * dimFactor)
          .style("pointer-events", "none");
      }

      g.append("text")
        .text(d.ghost ? `+ ${d.title}` : d.title)
        .attr("x", 14)
        .attr("y", 4)
        .attr("fill", d.ghost ? "#8891bd" : "#cbd5f5")
        .attr("font-style", d.ghost ? "italic" : "normal")
        .attr("opacity", (d.ghost ? 0.6 : 0.3 + d.brightness * 0.7) * dimFactor)
        .attr("font-size", 12)
        .style("pointer-events", "none");
    });

    starGroup.on("click", (_event, d) => onSelect(d));

    starGroup.call(
      d3
        .drag<SVGGElement, SimNode>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
    );

    simulation.on("tick", () => {
      constellation
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      starGroup.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [graph, selectedId, searchQuery, onSelect]);

  return <svg ref={svgRef} className="star-map" />;
}
