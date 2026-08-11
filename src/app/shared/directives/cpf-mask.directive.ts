import { Directive, HostListener, ElementRef, inject } from '@angular/core';
import { NgControl } from '@angular/forms';
import { formatarCpf } from '../../core/utils/cpf.util';

@Directive({
  selector: '[appCpfMask]',
  standalone: true,
})
export class CpfMaskDirective {
  private readonly elementRef = inject(ElementRef<HTMLInputElement>);
  private readonly ngControl = inject(NgControl, { self: true, optional: true });

  @HostListener('input')
  onInput(): void {
    const valorFormatado = formatarCpf(this.elementRef.nativeElement.value);
    this.elementRef.nativeElement.value = valorFormatado;
    this.ngControl?.control?.setValue(valorFormatado, { emitEvent: false });
  }
}
