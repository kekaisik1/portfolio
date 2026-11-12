/** The one mutable state of the journey. Everything else is computed from it each frame. */
import { viewOf, type View } from './camera';

export const S = {
  /** where the camera is along the walk (stops, fractional), and where the scroll says it should be */
  s: 0,
  target: 0,
  /** a place opening (0..1) and where that is heading */
  open: 0,
  openTo: 0,
  reduce: false,
  view: viewOf(1440, 900) as View,
  /** time of the last frame (ms), 0 = none yet */
  last: 0,
  /** when the greeting started to soak in; -1 = not yet */
  introAt: -1,
  /** the stop last announced and given its veil */
  shown: -1,
  /** the country the address last showed */
  country: '',
  /** the frame loop is scheduled */
  queued: false,
  /** focus is being moved by the page itself (not someone tabbing): don't travel to it */
  suppress: false,
  /** a hashchange the page caused itself: ignore it */
  skipHash: false,
  /** the place you are inside, if any */
  inSlug: '' as string,
  inClosing: false,
};
