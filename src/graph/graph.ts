import { Observable, ReplaySubject, combineLatest } from 'rxjs';
import { map, tap } from 'rxjs/operators';


interface ValidPortTypes {
  "string": string
  "number": number
  "numberArray": number[]
  "boolean": boolean
}

/** union of all valid  PortType */
type PortTypeKeys = keyof ValidPortTypes

/** union of all valid data types */
// type PortTypes = ValidPortTypes[keyof ValidPortTypes]

/** Node inputs are described by a unique label and a data type. Data types are defined as the keys of ValidPortTypes */
type InPort = readonly [string, PortTypeKeys]
type NodeInputs = readonly InPort[]

/** Compute outputs based on inputs */
// type ComputeInputs<T extends NodeInputs> = { [k in keyof T]: ValidPortTypes[T[k][1]] }


type InputTypes<T extends NodeInputs> = {
  [K in keyof T]: T[K] extends readonly [string, infer U] ? (U extends PortTypeKeys ? ValidPortTypes[U] : never) : never;
};
// type InputTypeLabels<T extends NodeInputs> = {
//   [K in keyof T]: T[K] extends readonly [string, infer U] ? (U extends PortTypeKeys ? U : never) : never;
// };
//
type InputKeys<T extends NodeInputs> = {
  [K in keyof T]: T[K] extends readonly [infer U, PortTypeKeys] ? (U extends string ? U : never) : never;
};

// type InputTypesUnion<T extends NodeInputs> = InputTypes<T>[number]
//type InputTypeLabelsUnion<T extends NodeInputs> = InputTypeLabels<T>[number]
type InputKeysUnion<T extends NodeInputs> = InputKeys<T>[number]

// const n = [["x", "number"], ["s", "string"]] as const
//
// type N = typeof n
//
// type NT = InputTypes<N>
// let nt: NT
// nt = [1, "a"]
//
// type NTU = InputTypesUnion<N> // string | number
// let ntu: NTU
// ntu = 1
// ntu = "a"
// //@ts-expect-error
// ntu = { a: 1 }
//
// type NTL = InputTypeLabels<N> // ["number", "string"]
// let ntl: NTL
// ntl = ["number", "string"]
// //@ts-expect-error
// ntl = ["string", "number"]
// //@ts-expect-error
// ntl = ["number"]
//
// type NTLU = InputTypeLabelsUnion<N> //  "string" | "number"
// let ntlu: NTLU
// ntlu = "number"
// ntlu = "string"
// //@ts-expect-error
// ntlu = "boolean"
//
// type NL = InputKeys<N> // ["x","s"]
// let nl: NL
// nl = ["x", "s"]
// //@ts-expect-error
// nl = ["s", "x"]
//
// type NLU = InputKeysUnion<N> // "x" | "s"
// let nlu: NLU
// nlu = "s"
// nlu = "x"
// //@ts-expect-error
// nlu = "z"
//
type InputTypeLabelByKey<T extends NodeInputs, K extends string> = Extract<T[number], readonly [K, any]>[1];
type InputTypeByKey<T extends NodeInputs, K extends string> = ValidPortTypes[Extract<T[number], readonly [K, any]>[1]];

type InputSubjectMap<T extends NodeInputs> = {
  [K in T[number][0]]: ReplaySubject<Extract<T[number], [K, any]>[1]>;
};
//
// let xType: InputTypeByKey<[["x", "number"]], "x">
// xType = 1
// let yType: InputTypeLabelByKey<[["y", "number"]], "y">
// //@ts-expect-error
// yType = "string"

export class Node<I extends NodeInputs = any, O extends PortTypeKeys = any> {
  public id: string
  public inputStreams: InputSubjectMap<I>
  public outputStream$: Observable<ValidPortTypes[O]>
  readonly inputMap: I
  //public inputTypes: Map<InputKeysUnion<I>, InputTypeLabelsUnion<I>>
  public currentValue: ValidPortTypes[O] | undefined

  private computeInputToOutput: (...args: InputTypes<I>) => ValidPortTypes[O]

  constructor(
    computeInputToOutput: (...args: InputTypes<I>) => ValidPortTypes[O],
    inputMap: I,
    public outputType: O,
    id: string = "default_node_id"
  ) {
    this.id = id
    this.inputMap = inputMap
    this.computeInputToOutput = computeInputToOutput;

    this.inputStreams = {} as any
    //this.inputStreams = new Map()
    //this.inputTypes = new Map()
    const inputSubjects: ReplaySubject<ValidPortTypes[PortTypeKeys]>[] = []
    inputMap.forEach((label) => {
      const key: InputKeysUnion<I> = label[0] as InputKeysUnion<I>
      const subject = new ReplaySubject<ValidPortTypes[PortTypeKeys]>(1)
      this.inputStreams[key] = subject
      //this.inputTypes.set(label as InputKeysUnion<I>, type as InputTypeLabelsUnion<I>)
      inputSubjects.push(subject)
    })

    this.outputStream$ = combineLatest(inputSubjects).pipe(
      map(inputs => this.computeInputToOutput(...inputs as unknown as InputTypes<I>)),
      tap(output => this.currentValue = output)
    );
  }

  getInputStream<T extends I, K extends T[number][0]>(key: K): ReplaySubject<InputTypeByKey<T, K>> {
    return this.inputStreams[key]
  }

  getInputType<T extends I, K extends T[number][0]>(key: K): InputTypeLabelByKey<T, K> {
    return this.inputMap.find(input => input[0] === key)
  }
}




export class Graph {
  private nodeAdjacencies: Map<Node, Node[]> = new Map();

  // TODO: add output type restriction
  addNode/**<T extends KeyValueTuple, U extends keyof T>**/(node: Node, connections: { targetNode: Node/**<T>**/, targetInputLabel: string/**keyof KeyValueTuple/**U**/ }[] = []) {
    this.nodeAdjacencies.set(node, []);
    connections.forEach(({ targetNode, targetInputLabel }) => {
      this.connectNodes(node, targetNode, targetInputLabel);
    });
  }
  addNodes(nodes: Node[]) {
    nodes.forEach((node) => this.addNode(node))
  }

  // Connect output of one node to input of another node
  connectNodes/**<T extends KeyValueTuple, U extends keyof T>**/(sourceNode: Node, targetNode: Node/**<T>**/, targetInputLabel: string/**U**/) {
    const sourceNodeAdjacencies = this.nodeAdjacencies.get(sourceNode)
    if (sourceNodeAdjacencies == undefined) {
      throw Error("Source node not present in graph");
    }
    if (!this.nodeAdjacencies.has(targetNode)) {
      throw Error("Target node not present in graph");
    }
    if (sourceNode.outputType != targetNode.getInputType(targetInputLabel)) {
      throw Error("Attempted to connect nodes of type ${sourceNode.outputType} and ${targetNode.inputMap.get(targetInputLabel))}")
    }
    // Add target node to the adjacency list of the source node
    sourceNodeAdjacencies.push(targetNode);

    // Subscribe the output of the source node to the input of the target node
    sourceNode.outputStream$.subscribe(output => {
      const input = targetNode.inputStreams[targetInputLabel]
      if (input === undefined) {
        throw Error("Attempted to access input label ${targetInputLabel} on node ${node}")
      }
      input.next(output);
    });
  }

  getConnections(node: Node) {
    return this.nodeAdjacencies.get(node)
  }
}
