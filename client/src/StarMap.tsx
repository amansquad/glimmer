import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { Graph, GraphNode } from "./types";

interface Props {
  graph: Graph;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

type SimNode = GraphNode & d3.SimulationNodeDatum;

export function StarMap({ graph, selectedId, onSelect }: Props) {
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

    starGroup
      .append("circle")
      .attr("r", (d) => 6 + d.brightness * 10)
      .attr("fill", "#fdf6e3")
      .attr("opacity", (d) => 0.15 + d.brightness * 0.85)
      .attr("stroke", (d) => (d.id === selectedId ? "#7dd3fc" : "none"))
      .attr("stroke-width", 2);

    starGroup
      .append("circle")
      .attr("r", (d) => 14 + d.brightness * 18)
      .attr("fill", "#fdf6e3")
      .attr("opacity", (d) => d.brightness * 0.12)
      .style("pointer-events", "none");

    starGroup
      .append("text")
      .text((d) => d.title)
      .attr("x", 14)
      .attr("y", 4)
      .attr("fill", "#cbd5f5")
      .attr("opacity", (d) => 0.3 + d.brightness * 0.7)
      .attr("font-size", 12)
      .style("pointer-events", "none");

    starGroup.on("click", (_event, d) => onSelect(d.id));

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
  }, [graph, selectedId, onSelect]);

  return <svg ref={svgRef} className="star-map" />;
}
