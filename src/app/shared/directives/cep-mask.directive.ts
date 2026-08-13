import { Directive, HostListener, ElementRef, inject } from '@angular/core';
import { NgControl } from '@angular/forms';
import { formatarCep } from '../../core/utils/cpf.util';

@Directive({
  selector: '[appCepMask]',
  standalone: true,
})
export class CepMaskDirective {
  private readonly elementRef = inject(ElementRef<HTMLInputElement>);
  private readonly ngControl = inject(NgControl, { self: true, optional: true });

  @HostListener('input')
  onInput(): void {
    const valorFormatado = formatarCep(this.elementRef.nativeElement.value);
    this.elementRef.nativeElement.value = valorFormatado;
    this.ngControl?.control?.setValue(valorFormatado, { emitEvent: false });
  }
}
