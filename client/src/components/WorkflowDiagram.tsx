import {
  ReactFlow,
  Node,
  Edge,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const WorkflowDiagram = () => {
  // Calculate positions with custom exact coordinates
  const calculateNodePositions = () => {
    // Exact positions for each node
    const positions = [
      { x: 15, y: 10 }, // Node 1: Create Project
      { x: 175, y: 130 }, // Node 2: Upload Files
      { x: 350, y: 10 }, // Node 3: Task Classification
      { x: 515, y: 130 }, // Node 4: Review Agents
      { x: 689, y: 10 }, // Node 5: Configure
      { x: 863, y: 130 }, // Node 6: Generate POC
    ];

    return positions;
  };

  const positions = calculateNodePositions();

  const nodeStyle = {
    background: "rgba(99, 102, 241, 0.2)",
    border: "1px solid rgba(255, 255, 255, 1)",
    borderRadius: "12px",
    width: 140,
    height: 80,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "bold",
    color: "rgba(255, 255, 255, 1)",
    textAlign: "center" as const,
    padding: "12px",
  };

  const initialNodes: Node[] = [
    {
      id: "1",
      type: "default",
      position: positions[0],
      data: { label: "1. Create Project" },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: nodeStyle,
    },
    {
      id: "2",
      type: "default",
      position: positions[1],
      data: { label: "2. Upload Files" },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: nodeStyle,
    },
    {
      id: "3",
      type: "default",
      position: positions[2],
      data: { label: "3. Task Classification" },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: nodeStyle,
    },
    {
      id: "4",
      type: "default",
      position: positions[3],
      data: { label: "4. Review Agents" },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: nodeStyle,
    },
    {
      id: "5",
      type: "default",
      position: positions[4],
      data: { label: "5. Configure" },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: nodeStyle,
    },
    {
      id: "6",
      type: "default",
      position: positions[5],
      data: { label: "6. AI-First POC Design" },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: nodeStyle,
    },
  ];

  const initialEdges: Edge[] = [
    {
      id: "e1-2",
      source: "1",
      target: "2",
      animated: true,
      style: { stroke: "#FF7518", strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#FF7518",
      },
    },
    {
      id: "e2-3",
      source: "2",
      target: "3",
      animated: true,
      style: { stroke: "#FF7518", strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#FF7518",
      },
    },
    {
      id: "e3-4",
      source: "3",
      target: "4",
      animated: true,
      style: { stroke: "#FF7518", strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#FF7518",
      },
    },
    {
      id: "e4-5",
      source: "4",
      target: "5",
      animated: true,
      style: { stroke: "#FF7518", strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#FF7518",
      },
    },
    {
      id: "e5-6",
      source: "5",
      target: "6",
      animated: true,
      style: { stroke: "#FF7518", strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#FF7518",
      },
    },
    {
      id: "e6-7",
      source: "6",
      target: "7",
      animated: true,
      style: { stroke: "#FF7518", strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#FF7518",
      },
    },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Handle node drag with boundary constraints
  const handleNodesChange = (changes: any) => {
    // Apply the changes first
    onNodesChange(changes);

    // Get actual container dimensions
    const container = document.querySelector(".workflow-diagram-container");
    const containerWidth = container?.clientWidth || 1200;
    const containerHeight = 220;

    // Then constrain positions to viewport
    setNodes((nds) =>
      nds.map((node) => {
        const nodeWidth = 140;
        const nodeHeight = 80;

        let x = node.position.x;
        let y = node.position.y;

        // Constrain x position (left edge at 0, right edge at container width - node width)
        if (x < 0) x = 0;
        if (x + nodeWidth > containerWidth) x = containerWidth - nodeWidth;

        // Constrain y position (top edge at 0, bottom edge at container height - node height)
        if (y < 0) y = 0;
        if (y + nodeHeight > containerHeight) y = containerHeight - nodeHeight;

        return {
          ...node,
          position: { x, y },
        };
      })
    );
  };

  return (
    <div
      className="workflow-diagram-container bg-protocol-darker rounded-lg"
      style={{ height: "220px", overflow: "hidden", position: "relative" }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={1}
        maxZoom={1}
        nodeExtent={[
          [0, 0],
          [1200, 220],
        ]}
        translateExtent={[
          [0, 0],
          [1200, 220],
        ]}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag={false}
        panOnScroll={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={true}
        autoPanOnNodeDrag={false}
        autoPanOnConnect={false}
      >
        <Background />
      </ReactFlow>
    </div>
  );
};

export default WorkflowDiagram;
