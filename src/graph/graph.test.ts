import { Node, Graph } from './graph.ts';


describe('Graph functionality', () => {
  describe('Graph functionality', () => {
    it('should process multiple connected nodes correctly', () => {
      const graph = new Graph();
      const sumNode = new Node((x: number, y: number) => x + y, [["x", "number"], ["y", "number"]], "number");
      const constantNode1 = new Node((x: number) => x, [["x", "number"]], "number");
      const constantNode2 = new Node((x: number) => x, [["x", "number"]], "number");
      const doubleNode = new Node((x: number) => x * 2, [["x", "number"]], "number");
      const outSub = jest.fn((v) => v)
      const output$ = sumNode.outputStream$
      output$.subscribe(outSub);


      graph.addNode(sumNode);
      graph.addNode(doubleNode);
      graph.addNode(constantNode1);
      graph.addNode(constantNode2);

      graph.connectNodes(constantNode1, doubleNode, "x");
      graph.connectNodes(doubleNode, sumNode, "x");
      graph.connectNodes(constantNode2, sumNode, "y");

      expect(sumNode.currentValue).toBeUndefined()
      expect(outSub).toHaveBeenCalledTimes(0)

      constantNode1.inputStreams.get("x")!.next(5)
      expect(sumNode.currentValue).toBeUndefined()
      expect(outSub).toHaveBeenCalledTimes(0)

      constantNode2.inputStreams.get("x")!.next(7)
      expect(sumNode.currentValue).toEqual(17) //5*2 + 7
      expect(outSub).toHaveBeenCalledTimes(1)

      constantNode2.inputStreams.get("x")!.next(9)
      expect(sumNode.currentValue).toEqual(19)
      expect(outSub).toHaveBeenCalledTimes(2)

      constantNode2.inputStreams.get("x")!.next(11)
      expect(sumNode.currentValue).toEqual(21)
      expect(outSub).toHaveBeenCalledTimes(3)
    });


    it('should handle node connection order correctly', () => {
      const graph = new Graph();
      const incrementNode = new Node((x: number) => x + 1, [["x", "number"]], "number");
      const squareNode = new Node((x: number) => x * x, [["x", "number"]], "number");
      ;
      const outSub = jest.fn((v) => v)
      const output$ = squareNode.outputStream$
      output$.subscribe(outSub);

      graph.addNode(incrementNode);
      graph.addNode(squareNode);

      // Connect incrementNode -> squareNode
      graph.connectNodes(incrementNode, squareNode, "x");

      incrementNode.inputStreams.get("x")!.next(2);

      expect(squareNode.currentValue).toEqual(9)// Increment 2 to 3, then square 3 to 9
      expect(outSub).toHaveBeenCalledTimes(1)
      expect(graph.getConnections(incrementNode)?.length).toEqual(1)
    });

    it("should throw error if connection types don't match", () => {
      const graph = new Graph();
      const incrementNode = new Node((x: number) => x + 1, [["x", "number"]], "number");
      const doubleStringNode = new Node((x: string) => x + x, [["x", "string"]], "string");
      const outSub = jest.fn((v) => v)
      const output$ = doubleStringNode.outputStream$
      output$.subscribe(outSub);

      graph.addNode(incrementNode);
      graph.addNode(doubleStringNode);

      try {
        expect(graph.connectNodes(incrementNode, doubleStringNode, "x")).toThrow()
      } catch {
        incrementNode.inputStreams.get("x")!.next(2);

        expect(doubleStringNode.currentValue).toEqual(undefined) // data should never have been passed down
        expect(outSub).toHaveBeenCalledTimes(0)
        expect(graph.getConnections(incrementNode)!.length).toEqual(0)
      }

    });
    it("should give the correct number of connections", () => {
      const constantNode = new Node((x: number) => x, [["x", "number"]], "number");
      const graph = new Graph();
      const squareNode = new Node((x: number) => x * x, [["x", "number"]], "number");
      const incrementNode = new Node((x: number) => x + 1, [["x", "number"]], "number");
      const sumNode1 = new Node((x: number, y: number) => x + y, [["x", "number"], ["y", "number"]], "number");
      const sumNode2 = new Node((x: number, y: number) => x + y, [["x", "number"], ["y", "number"]], "number");
      const outSub = jest.fn((v) => v)
      const output$ = sumNode2.outputStream$
      output$.subscribe(outSub);

      graph.addNodes([constantNode, incrementNode, squareNode, sumNode1, sumNode2]);
      graph.connectNodes(constantNode, incrementNode, "x")
      graph.connectNodes(incrementNode, squareNode, "x")
      graph.connectNodes(constantNode, sumNode1, "x")
      graph.connectNodes(constantNode, sumNode1, "y")
      graph.connectNodes(constantNode, sumNode2, "x")
      graph.connectNodes(sumNode1, sumNode2, "y")
      // TODO finish test!!!
      expect(graph.getConnections(constantNode)!.length).toEqual(4)

      constantNode.getInputStream("x").next(2);

      // expect(outSub).toHaveBeenCalledTimes(0)
      // expect(graph.getConnections(incrementNode)!.length).toEqual(0)

    });
  });
});

