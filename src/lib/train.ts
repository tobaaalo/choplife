import type { TrainItem } from '../../shared/train/types'
import { commit, toast } from './store'

export function saveTrain(item: TrainItem): void {
  commit([{ op: 'put', entity: 'train', id: item.id, body: item }])
}

export function removeTrain(item: TrainItem, what: string): void {
  commit([{ op: 'delete', entity: 'train', id: item.id }])
  toast(`${what} deleted`, { undo: () => saveTrain(item) })
}
