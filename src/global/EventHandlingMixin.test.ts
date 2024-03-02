import { IClass } from '/home/websocket/websocket/src/global/EventHandlingMixin';

describe('EventHandlingMixin', () => {
  it('should define IClass interface correctly', () => {
    const eventTypes: EventTypes[] = ['click', 'hover', 'resize'];
    const eventHandlers: IEvent[] = [handleClick, handleHover, handleResize];

    const classInstance: IClass = {};

    eventTypes.forEach((eventType, index) => {
      classInstance[eventType] = eventHandlers[index];
    });

    expect(classInstance).toEqual({
      click: handleClick,
      hover: handleHover,
      resize: handleResize,
    });
  });
});