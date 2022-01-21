console.clear();

class Collapsible {
  constructor($collapsible, index = null, $accordion = null) {
    this.index = index;
    this.siblingsObjects;
    this.isTransitioning = false;

    // Used when used as a dropdown outside of an accordion
    this.toggleMode = 'click';

    // Used $accordion - when we need data-collapse-siblings feature
    this.$accordion = $accordion;
    this.$collapsible = $collapsible;
    this.$trigger = this.$collapsible.querySelector('.collapsible__trigger');
    this.$content = this.$collapsible.querySelector('.collapsible__content');
    this.init();
  }

  static _instancesCount = 0;
  static _incrementInstancesCount() {
    this._instancesCount = this._instancesCount + 1;
  }

  static _classes = {
    COLLAPSING: 'collapsing',
    COLLAPSED: 'collapsed',
    UNCOLLAPSED: 'uncollapsed',
  };

  static _events = {
    TRANSITION_END: 'transition_end',
    SHOWN: 'shown',
    HIDDEN: 'hidden',
  };

  static _triggerTransitionEnd($el) {
    $el.dispatchEvent(new Event(this._events.TRANSITION_END));
  }

  static _getTransitionDurationFromElement($element) {
    if (!$element) {
      return 0;
    }

    // Get transition-duration of the element
    let { transitionDuration, transitionDelay } =
      window.getComputedStyle($element);

    const floatTransitionDuration = Number.parseFloat(transitionDuration);
    const floatTransitionDelay = Number.parseFloat(transitionDelay);

    // Return 0 if element or transition duration is not found
    if (!floatTransitionDuration && !floatTransitionDelay) {
      return 0;
    }

    // If multiple durations are defined, take the first
    transitionDuration = transitionDuration.split(',')[0];
    transitionDelay = transitionDelay.split(',')[0];

    return (
      (Number.parseFloat(transitionDuration) +
        Number.parseFloat(transitionDelay)) *
      1000
    );
  }

  static _executeAfterTransition(
    callback,
    transitionElement,
    durationEl,
    waitForTransition = true
  ) {
    if (!waitForTransition) {
      callback();
      return;
    }

    const durationOffset = 5;
    const calculatedDuration =
      this._getTransitionDurationFromElement(durationEl) + durationOffset;
    let called = false;

    const handler = ({ target }) => {
      if (target !== transitionElement) {
        return;
      }

      called = true;
      transitionElement.removeEventListener(
        this._events.TRANSITION_END,
        handler
      );
      callback();
    };

    transitionElement.addEventListener(this._events.TRANSITION_END, handler);
    setTimeout(() => {
      if (!called) {
        this._triggerTransitionEnd(transitionElement);
      }
    }, calculatedDuration);
  }

  get isShown() {
    return this.$collapsible.classList.contains(
      this.constructor._classes.UNCOLLAPSED
    );
  }

  pushSiblings(siblingsObjects) {
    this.siblingsObjects = siblingsObjects;
    console.log(this.siblingsObjects);
  }

  toggleAriaAndCollapsed(isOpen) {
    this.$collapsible.setAttribute('aria-expanded', isOpen);
    this.$collapsible.classList[isOpen ? 'remove' : 'add'](
      this.constructor._classes.COLLAPSED
    );
  }

  show() {
    if (this.isTransitioning || this.isShown) return;
    this.$collapsible.classList.add(this.constructor._classes.COLLAPSING);
    this.$content.style.height = 0;
    this.toggleAriaAndCollapsed(true);
    this.isTransitioning = true;
    const complete = () => {
      this.isTransitioning = false;
      this.$collapsible.classList.remove(this.constructor._classes.COLLAPSING);
      this.$collapsible.classList.add(this.constructor._classes.UNCOLLAPSED);
      this.$content.style.height = '';
      this.$content.dispatchEvent(new Event(this.constructor._events.SHOWN));
    };

    this.constructor._executeAfterTransition(
      complete,
      this.$collapsible,
      this.$content,
      true
    );
    this.$content.style.height = `${this.$content.scrollHeight}px`;
  }

  hide() {
    if (this.isTransitioning || !this.isShown) return;
    this.$content.style.height = `${
      this.$content.getBoundingClientRect().height
    }px`;
    // reset animation hack
    void this.$content.offsetHeight;
    this.$collapsible.classList.add(this.constructor._classes.COLLAPSING);
    this.$collapsible.classList.remove(this.constructor._classes.UNCOLLAPSED);
    this.toggleAriaAndCollapsed(false);
    this.isTransitioning = true;
    const complete = () => {
      this.isTransitioning = false;
      this.$collapsible.classList.remove(this.constructor._classes.COLLAPSING);
      this.$content.dispatchEvent(
        new Event(this.constructor._events.TRANSITION_END)
      );
    };
    this.$content.style.height = '';
    this.constructor._executeAfterTransition(
      complete,
      this.$collapsible,
      this.$content,
      true
    );
  }

  hideSiblings() {
    this.siblingsObjects.forEach((sibling) => sibling.hide());
  }

  toggle() {
    if (this.$accordion) {
      this.$accordion.dataset.hasOwnProperty('collapseSiblings') &&
        this.hideSiblings();
    }
    this[this.isShown ? 'hide' : 'show']();
  }

  init() {
    if (
      this.$collapsible.dataset.hasOwnProperty('toggleMode') &&
      this.$collapsible.dataset.toggleMode === 'hover'
    ) {
      this.toggleMode = 'hover';
      this.$trigger.addEventListener('mouseenter', this.show.bind(this));
      this.$collapsible.addEventListener('mouseleave', this.hide.bind(this));
    } else {
      this.$trigger.addEventListener('click', this.toggle.bind(this));
    }

    this.constructor._incrementInstancesCount();
  }
}

class Accordions {
  constructor() {
    this.$accordions = document.querySelectorAll('.accordion') || false;
    this.init();
  }

  init() {
    if (!this.$accordions) return;

    this.$accordions.forEach(($acc) => {
      let accordionPanels = [];
      $acc
        .querySelectorAll(':scope > .collapsible')
        .forEach(($panel, index) =>
          accordionPanels.push(new Collapsible($panel, index, $acc))
        );

      accordionPanels.forEach((accPanelCls, index) => {
        const siblings = accordionPanels.filter((acp) => acp.index !== index);
        accPanelCls.pushSiblings(siblings);
      });
    });
  }
}

// Initi multiple collapsibles as panels of accordions
new Accordions();

// init single Collapsible as a dropdown (Outside of Accordion)
const $collapsibleDropdowns =
  document.querySelectorAll('.collapsible[data-collapsible-dropdown]') || false;
if ($collapsibleDropdowns) {
  $collapsibleDropdowns.forEach(($dropdown) => new Collapsible($dropdown));
}
