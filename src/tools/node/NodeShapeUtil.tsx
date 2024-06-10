import {
  Rectangle2d,
  ShapePropsType,
  ShapeUtil,
  T,
  TLBaseShape,
  TLShape,
} from "tldraw";
import { useGraph, GraphUI } from "../../graph/graphContext";
import { useEffect, useState } from "react";
import { InPort, PortTypeKey } from "../../graph/node";
import { NodeBase } from "./nodeComponents";
// import { Node, port } from "../../graph/node";
// import { useNode } from "../../graph/useNode";



const nodeShapeProps = {
  nodeId: T.string,
  nodeType: T.string,
  inputTypes: T.array,
  outputType: T.string,
  currentValue: T.unknown,
  w: T.number,
  h: T.number,
};


export type NodeShapeProps = ShapePropsType<typeof nodeShapeProps>;

export type NodeShape = TLBaseShape<"node", NodeShapeProps>;

function isNodeShape(shape: TLShape): shape is NodeShape {
  return shape?.type == "node"
}

export class NodeShapeUtil extends ShapeUtil<NodeShape> {
  static override type = "node" as const;
  static override props = nodeShapeProps;
  graphUI: GraphUI | null = null

  override isAspectRatioLocked = (_shape: NodeShape) => true;
  override canResize = (_shape: NodeShape) => true;

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

  logConnection(eventType: string, baseShape: NodeShape, connectionShape: TLShape[]) {
    console.log(`${eventType}
      Base Shape:
        ${baseShape.props.nodeId}
      ConnectionShape Shapes(${connectionShape.length}):
        ${JSON.stringify(connectionShape.map((s) => {
      if (isNodeShape(s)) {
        return "node: " + s.props.nodeId
      }
      else {
        return s
      }
    }))
      }`)
  }


  getDefaultProps(): NodeShape["props"] {
    return {
      w: 140,
      h: 60,
      nodeId: "default_node_id",
      nodeType: "constant",
      inputTypes: [],
      outputType: "number",
      currentValue: undefined
      //node: createConstantNode("MyDefaultConstantNode")
    };
  }

  getGeometry(shape: NodeShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      // should hitbox be edges only, or filled to include center
      isFilled: true,
      // make shape editable with a single click if it is already selected
      // causes problems if enabled when the shape is editable
      isLabel: false,
    });
  }

  indicator(shape: NodeShape) {
    return <rect width={shape.props.w} height={shape.props.h} />;
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
    const graphUI = useGraph()

    // useEffect(() => {
    //   console.log("refreshing graph")
    //   this.graphUI = graphUI // hacky way to get up to date graph for functions on util to have access to the graph
    //   // ideally we could pass this in the constructor, but tldraw doesn't let us construct the shapeutil ourselves
    // }, [graphUI]
    // )

    const { nodeType, nodeId, inputTypes, outputType, w, h } = shape.props
    const node = graphUI.graph.getNode(nodeId)
    if (node === undefined) {
      throw Error("Attempted to render node: ${nodeId}, which doesn't exist in the graph!")
    }

    const [currentValue, setCurrentValue] = useState(node.currentValue)

    function updateAndFire(value: number) {
      //console.log(node)
      // const nodeUp = graphUI.graph.getNode(nodeId)
      //console.log(nodeUp)
      if (node != undefined) {
        //nodeUp.currentValue = value
        //console.log(value)
        //console.log(nodeUp)
        node.inputStreams["x"].next(value)
      }
    }

    useEffect(() => {
      console.log("Setting up subscription to node ", node.id)
      node.outputPort$.subscribe((v) => {
        console.log(`UI subscriptiong to outputPort of ${node.id}, currentValue=${currentValue}, value=${v}`)
        if (v != undefined && currentValue != v) {
          console.log("UPDATING VALUE")
          setCurrentValue(v)
        }
        else {
          console.log("NOT updating value",)
        }
      })
    }, []
    )



    //const graphDispatch = useGraphDispatch()
    //console.log("initial render")
    return (
      <NodeBase
        width={w}
        height={h}
        nodeType={nodeType}
        nodeId={nodeId}
        inputPorts={inputTypes as InPort[]}
        outputPort={{ name: "out", portType: outputType as PortTypeKey }}
        currentValue={currentValue as string} //TODO make this more correct
        handleValueUpdate={updateAndFire}
      >

      </NodeBase>
    )
  }
}




