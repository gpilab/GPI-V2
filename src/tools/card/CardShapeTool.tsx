import { BaseBoxShapeTool } from 'tldraw'
export class CardShapeTool extends BaseBoxShapeTool {
  static override id = 'card'
  static override initial = 'idle'
  override shapeType = 'card'
}

/*
This file contains our custom tool. The tool is a StateNode with the `id` "card".

We get a lot of functionality for free by extending the BaseBoxShapeTool. but we can
handle events in out own way by overriding methods like onDoubleClick. For an example 
of a tool with more custom functionality, check out the screenshot-tool example. 

*/
