import {
  Rectangle2d,
  ShapePropsType,
  ShapeUtil,
  T,
  TLBaseShape,
  TLShape,
} from "tldraw";
import { useGraph, GraphUI, useGraphDispatch } from "../../graph/graphContext";
import { Port, Node } from "../../graph/node";
import { NodeBase } from "./components/nodeBase.tsx";
import { createAddNode, createConstantNode, createMultiplyNode, createSubtractNode, outPortFunction } from "../../graph/nodeDefinitions.ts";
import { useEffect, useState } from "react";

const nodeShapeProps = {
  nodeId: T.string,
  nodeType: T.string,
  inputPorts: T.array,
  outputPort: T.any,
  currentValue: T.unknown,
  placed: T.any,
  w: T.number,
  h: T.number,
};

export type NodeShapeProps = ShapePropsType<typeof nodeShapeProps>;
export type NodeShape = TLBaseShape<"node", NodeShapeProps>;

export const createNodeShapeProps = (node: Node, placed = true) => {
  const { width, height, type } = node.nodeAttributes
  console.log("creating props for ", node.nodeId)
  return {
    nodeId: node.nodeId,
    nodeType: type,
    inputPorts: node.inputPorts,
    outputPort: node.outputPort,
    w: width ? width : 200,
    h: height ? height : 100,
    placed: placed
  }
}


export class NodeShapeUtil extends ShapeUtil<NodeShape> {
  static override type = "node" as const;
  static override props = nodeShapeProps;
  graphUI: GraphUI | null = null

  override isAspectRatioLocked = (_shape: NodeShape) => false;
  override canResize = (_shape: NodeShape) => false;

  //called for all shapes in the scene when an arrow is being placed?
  override canBind = (_shape: NodeShape, _otherShape?: any) => {
    //this.logConnection("canBind", _shape, [_otherShape])
    return true
  }
  override canEdit = (_shape: NodeShape) => false;

  //called for all shapes in the scene when anything moves?
  override  canDropShapes(_shape: NodeShape, _shapes: TLShape[]): boolean {
    //this.logConnection("canDropShapes", shape, shapes)
    return true
  }
  override  canReceiveNewChildrenOfType(_shape: NodeShape, _type: string): boolean {
    // console.log(`trying to recieve ${type} from`, shape.props.nodeId)
    return true
  }
  // override onBeforeUpdate = (prev: NodeShape, next: NodeShape) => {
  //   console.log(`prev: ${JSON.stringify(prev)}
  //               next: ${JSON.stringify(next)}`)
  // }

  // override onDragShapesOut = (shape: NodeShape, dragOutShapes: TLShape[]) => {
  //   this.logConnection("onDragShapesOut", shape, dragOutShapes)
  // }
  //
  // override onDragShapesOver = (shape: NodeShape, dragOutShapes: TLShape[]) => {
  //   this.logConnection("onDragShapesOver", shape, dragOutShapes)
  // }



  getDefaultProps(): NodeShape["props"] {
    return {
      w: 140,
      h: 60,
      nodeId: "default_node_id",
      nodeType: "constant",
      inputPorts: [],
      outputPort: outPortFunction("number"),
      placed: true,
      currentValue: undefined
    };
  }

  getGeometry(shape: NodeShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
      isLabel: false,
    });
  }

  indicator(shape: NodeShape) {
    return <rect id={"myShapeIndicator" + shape.props.nodeId} strokeOpacity={0.5} style={{ zIndex: 0 }} rx={4} width={shape.props.w} height={shape.props.h} />;
  }

  // override onResize: TLOnResizeHandler<MathTextShape> = (shape, info) => {
  //   const { initialBounds, scaleX, scaleY, newPoint } = info;
  //
  //   const scaleDelta = Math.max(
  //     0.01,
  //     (Math.abs(scaleX) + Math.abs(scaleY)) / 2,
  //   );
  //
  //   // Compute the offset (if flipped X or flipped Y)
  //   const offset = new Vec(0, 0);
  //
  //   if (scaleX < 0) {
  //     offset.x = -(initialBounds.width * scaleDelta);
  //   }
  //   if (scaleY < 0) {
  //     offset.y = -(initialBounds.height * scaleDelta);
  //   }
  //
  //   // Apply the offset to the new point
  //   const { x, y } = Vec.Add(newPoint, offset.rot(shape.rotation));
  //
  //   const next = {
  //     x,
  //     y,
  //     props: {
  //       scale: scaleDelta * shape.props.scale,
  //     },
  //   };
  //   return {
  //     id: shape.id,
  //     type: shape.type,
  //     ...next,
  //   };
  // };


  component(shape: NodeShape) {
    const { nodeId, inputPorts: inputPorts, outputPort, w, h } = shape.props

    const graphUI = useGraph()
    const graphDispatch = useGraphDispatch()
    const [node, setNode] = useState(graphUI.graph.getNode(nodeId))
    // const node = graphUI.graph.getNode(shape.id)

    // console.log("rendering node ", nodeId)
    // console.log("with Id ", shape.id)
    // console.log("nodeId from graph", node?.nodeId)

    const nodeNotInGraph =
      Error(`Attempted to update the value of node ${shape.props.nodeId}, but it doesn't exist in the graph!`)
    // useEffect(() => {
    //   if (node === undefined) {
    //     let newNode = null
    //
    //     if (nodeType == "add") {
    //       newNode = createAddNode(shape.id)
    //     } else if (nodeType == "constant") {
    //       newNode = createConstantNode(shape.id, 0)
    //     }
    //     else if (nodeType == "subtract") {
    //       newNode = createSubtractNode(shape.id)
    //     }
    //     else if (nodeType == "multiply") {
    //       newNode = createMultiplyNode(shape.id)
    //     }
    //     else {
    //       console.log("couldn't find node from info!")
    //       newNode = createAddNode(shape.id)
    //     }
    //     console.log("node not found in graph, adding it now:", newNode.nodeId)
    //     console.log("(currently hardcoded as constant)")
    //     graphDispatch({ type: "addNode", node: newNode })
    //     setNode(node)
    //     console.log("Dispatched adding the node")
    //   } else {
    //     console.log("node alreay found, no need to do anything ", nodeId)
    //   }
    // }, [graphUI])
    //


    return (
      <div>
        <NodeBase
          width={w}
          height={h}
          nodeAttributes={node?.nodeAttributes}
          nodeId={nodeId}
          inputPorts={inputPorts as Port[]}
          outputPort={outputPort}
          currentValue={node?.currentValue as string} //TODO make type more correct
          handleValueUpdate={(v, portLabel) => {
            if (node === undefined) {
              console.log("value update!")
              throw nodeNotInGraph
            }
            return graphDispatch(
              {
                type: "fireNode",
                nodeId: node.nodeId,
                port: node.getInputPort(portLabel),
                value: v
              })
          }}
        >
        </NodeBase>
        {shape.props.placed ? null : "Parent Placing..."}
      </div>
    )
  }
}

// function isNodeShape(shape: TLShape): shape is NodeShape {
//   return shape?.type == "node"
// }
//
// function logConnection(eventType: string, baseShape: NodeShape, connectionShape: TLShape[]) {
//   console.log(`${eventType}
//       Base Shape:
//         ${baseShape.props.nodeId}
//       ConnectionShape Shapes(${connectionShape.length}):
//         ${JSON.stringify(connectionShape.map((s) => {
//     if (isNodeShape(s)) {
//       return "node: " + s.props.nodeId
//     }
//     else {
//       return s
//     }
//   }))
//     }`)
// }
